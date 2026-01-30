import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Schemas
const manualEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  bedtimeStart: z.string(), // ISO datetime or HH:mm
  bedtimeEnd: z.string(),
  awakenings: z.number().int().min(0).optional(),
  subjectiveQuality: z.number().int().min(1).max(5).optional(),
});

const getSessionsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional(),
});

const sleepRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ═══════════════════════════════════════════════════════════
  // GET /sleep/sessions
  // ═══════════════════════════════════════════════════════════
  fastify.get('/sessions', async (request, reply) => {
    const { userId } = request.user;
    const query = getSessionsSchema.parse(request.query);

    const where: any = { userId };

    if (query.from) {
      where.date = { ...where.date, gte: new Date(query.from) };
    }
    if (query.to) {
      where.date = { ...where.date, lte: new Date(query.to) };
    }

    const sessions = await fastify.prisma.sleepSessionNormalized.findMany({
      where,
      orderBy: { date: 'desc' },
      take: query.limit ? parseInt(query.limit) : 30,
    });

    return { sessions };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /sleep/sessions/:date
  // ═══════════════════════════════════════════════════════════
  fastify.get('/sessions/:date', async (request, reply) => {
    const { userId } = request.user;
    const { date } = request.params as { date: string };

    const session = await fastify.prisma.sleepSessionNormalized.findFirst({
      where: {
        userId,
        date: new Date(date),
      },
    });

    return { session };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /sleep/sessions/manual
  // ═══════════════════════════════════════════════════════════
  fastify.post('/sessions/manual', async (request, reply) => {
    const { userId } = request.user;
    const body = manualEntrySchema.parse(request.body);

    // Parse times
    const date = new Date(body.date);
    
    // Handle bedtime - could be HH:mm or full ISO
    let bedtimeStart: Date;
    let bedtimeEnd: Date;

    if (body.bedtimeStart.includes('T')) {
      bedtimeStart = new Date(body.bedtimeStart);
    } else {
      // HH:mm format - assume previous day for bedtime
      const [hours, minutes] = body.bedtimeStart.split(':').map(Number);
      bedtimeStart = new Date(date);
      bedtimeStart.setDate(bedtimeStart.getDate() - 1);
      bedtimeStart.setHours(hours, minutes, 0, 0);
    }

    if (body.bedtimeEnd.includes('T')) {
      bedtimeEnd = new Date(body.bedtimeEnd);
    } else {
      // HH:mm format
      const [hours, minutes] = body.bedtimeEnd.split(':').map(Number);
      bedtimeEnd = new Date(date);
      bedtimeEnd.setHours(hours, minutes, 0, 0);
    }

    // Calculate total sleep time (simple: end - start)
    const totalSleepTime = Math.round((bedtimeEnd.getTime() - bedtimeStart.getTime()) / 60000);

    // Upsert session
    const session = await fastify.prisma.sleepSessionNormalized.upsert({
      where: {
        userId_date_source: {
          userId,
          date,
          source: 'MANUAL',
        },
      },
      create: {
        userId,
        source: 'MANUAL',
        date,
        bedtimeStart,
        bedtimeEnd,
        totalSleepTime,
        awakenings: body.awakenings,
        subjectiveQuality: body.subjectiveQuality,
      },
      update: {
        bedtimeStart,
        bedtimeEnd,
        totalSleepTime,
        awakenings: body.awakenings,
        subjectiveQuality: body.subjectiveQuality,
        syncedAt: new Date(),
      },
    });

    return { session };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /sleep/summary
  // ═══════════════════════════════════════════════════════════
  fastify.get('/summary', async (request, reply) => {
    const { userId } = request.user;
    const { days = '7' } = request.query as { days?: string };

    const daysNum = parseInt(days);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysNum);

    const sessions = await fastify.prisma.sleepSessionNormalized.findMany({
      where: {
        userId,
        date: { gte: fromDate },
      },
      orderBy: { date: 'desc' },
    });

    if (sessions.length === 0) {
      return {
        avgTST: null,
        avgSOL: null,
        avgAwakenings: null,
        trend: null,
        streak: 0,
        totalSessions: 0,
      };
    }

    // Calculate averages
    const avgTST = Math.round(
      sessions.reduce((sum, s) => sum + s.totalSleepTime, 0) / sessions.length
    );

    const solSessions = sessions.filter((s) => s.sleepOnsetLatency !== null);
    const avgSOL = solSessions.length > 0
      ? Math.round(solSessions.reduce((sum, s) => sum + (s.sleepOnsetLatency ?? 0), 0) / solSessions.length)
      : null;

    const awakeningSessions = sessions.filter((s) => s.awakenings !== null);
    const avgAwakenings = awakeningSessions.length > 0
      ? Math.round(awakeningSessions.reduce((sum, s) => sum + (s.awakenings ?? 0), 0) / awakeningSessions.length * 10) / 10
      : null;

    // Calculate trend (compare first half to second half)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (sessions.length >= 4) {
      const mid = Math.floor(sessions.length / 2);
      const recentAvg = sessions.slice(0, mid).reduce((sum, s) => sum + s.totalSleepTime, 0) / mid;
      const olderAvg = sessions.slice(mid).reduce((sum, s) => sum + s.totalSleepTime, 0) / (sessions.length - mid);
      
      const diff = recentAvg - olderAvg;
      if (diff > 15) trend = 'improving';
      else if (diff < -15) trend = 'declining';
    }

    // Calculate streak (consecutive days with sessions)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < daysNum; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasSession = sessions.some((s) => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });
      
      if (hasSession) {
        streak++;
      } else {
        break;
      }
    }

    return {
      avgTST,
      avgSOL,
      avgAwakenings,
      trend,
      streak,
      totalSessions: sessions.length,
    };
  });
};

export default sleepRoutes;
