import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Schemas
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
  style: z.enum(['SCIENTIFIC', 'MIXED', 'SPIRITUAL']).optional(),
  focusTags: z.array(z.string()).optional(),
  maxActiveClients: z.number().int().min(1).max(50).optional(),
  status: z.enum(['OPEN', 'FULL', 'PAUSED']).optional(),
});

const setActionSchema = z.object({
  actionTemplateId: z.string(),
});

const internalNoteSchema = z.object({
  content: z.string().max(500),
});

const reportCommentSchema = z.object({
  comment: z.string().max(500),
});

const leadResponseSchema = z.object({
  reason: z.string().max(200).optional(),
});

const coachRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Verify user is a coach
  fastify.addHook('preHandler', async (request, reply) => {
    const coach = await fastify.prisma.coachProfile.findUnique({
      where: { userId: request.user.userId },
    });
    
    if (!coach) {
      return reply.code(403).send({ error: 'Not a coach' });
    }
    
    // Attach coach to request
    (request as any).coach = coach;
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/profile
  // ═══════════════════════════════════════════════════════════
  fastify.get('/profile', async (request, reply) => {
    const coach = (request as any).coach;
    return { profile: coach };
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /coach/profile
  // ═══════════════════════════════════════════════════════════
  fastify.patch('/profile', async (request, reply) => {
    const coach = (request as any).coach;
    const body = updateProfileSchema.parse(request.body);

    const updated = await fastify.prisma.coachProfile.update({
      where: { id: coach.id },
      data: body,
    });

    return { profile: updated };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/clients
  // ═══════════════════════════════════════════════════════════
  fastify.get('/clients', async (request, reply) => {
    const coach = (request as any).coach;

    const clients = await fastify.prisma.programInstance.findMany({
      where: {
        coachId: coach.id,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            locale: true,
          },
        },
        template: true,
        days: {
          orderBy: { dayNumber: 'desc' },
          take: 3,
          include: {
            checkIn: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate traffic light status for each client
    const clientsWithStatus = clients.map((client) => {
      const recentDays = client.days;
      const missedCheckIns = recentDays.filter((d) => !d.checkIn).length;
      
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (missedCheckIns >= 2) status = 'red';
      else if (missedCheckIns >= 1) status = 'yellow';

      return {
        ...client,
        trafficLight: status,
      };
    });

    return { clients: clientsWithStatus };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/clients/:userId
  // ═══════════════════════════════════════════════════════════
  fastify.get('/clients/:userId', async (request, reply) => {
    const coach = (request as any).coach;
    const { userId } = request.params as { userId: string };

    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        coachId: coach.id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            locale: true,
            timezone: true,
          },
        },
        template: true,
        days: {
          include: {
            actionTemplate: true,
            checkIn: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        report: true,
      },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Get sleep data for this client
    const sleepSessions = await fastify.prisma.sleepSessionNormalized.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 14,
    });

    // Get internal notes
    const notes = await fastify.prisma.coachInternalNote.findMany({
      where: {
        coachId: coach.id,
        clientUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      client: instance,
      sleepSessions,
      notes,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /coach/clients/:userId/set-action
  // ═══════════════════════════════════════════════════════════
  fastify.post('/clients/:userId/set-action', async (request, reply) => {
    const coach = (request as any).coach;
    const { userId } = request.params as { userId: string };
    const body = setActionSchema.parse(request.body);

    // Verify this is coach's client
    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        coachId: coach.id,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'Active client not found' });
    }

    // Get today's day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await fastify.prisma.programDay.findFirst({
      where: {
        programInstanceId: instance.id,
        date: today,
      },
    });

    if (!day) {
      return reply.code(404).send({ error: 'No program day for today' });
    }

    // Update action
    const updated = await fastify.prisma.programDay.update({
      where: { id: day.id },
      data: { actionTemplateId: body.actionTemplateId },
      include: { actionTemplate: true },
    });

    return { day: updated };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/clients/:userId/notes
  // ═══════════════════════════════════════════════════════════
  fastify.get('/clients/:userId/notes', async (request, reply) => {
    const coach = (request as any).coach;
    const { userId } = request.params as { userId: string };

    const notes = await fastify.prisma.coachInternalNote.findMany({
      where: {
        coachId: coach.id,
        clientUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { notes };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /coach/clients/:userId/notes
  // ═══════════════════════════════════════════════════════════
  fastify.post('/clients/:userId/notes', async (request, reply) => {
    const coach = (request as any).coach;
    const { userId } = request.params as { userId: string };
    const body = internalNoteSchema.parse(request.body);

    const note = await fastify.prisma.coachInternalNote.create({
      data: {
        coachId: coach.id,
        clientUserId: userId,
        content: body.content,
      },
    });

    return { note };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /coach/clients/:userId/report-comment
  // ═══════════════════════════════════════════════════════════
  fastify.post('/clients/:userId/report-comment', async (request, reply) => {
    const coach = (request as any).coach;
    const { userId } = request.params as { userId: string };
    const body = reportCommentSchema.parse(request.body);

    // Find the program instance
    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        coachId: coach.id,
        userId,
      },
      include: { report: true },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    if (!instance.report) {
      return reply.code(400).send({ error: 'Report not yet generated' });
    }

    const report = await fastify.prisma.programReport.update({
      where: { id: instance.report.id },
      data: { coachComment: body.comment },
    });

    return { report };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/lead-requests
  // ═══════════════════════════════════════════════════════════
  fastify.get('/lead-requests', async (request, reply) => {
    const coach = (request as any).coach;

    const requests = await fastify.prisma.leadRequest.findMany({
      where: {
        coachId: coach.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Add hours remaining for each request
    const requestsWithTime = requests.map((req) => ({
      ...req,
      hoursRemaining: Math.max(0, Math.round((req.expiresAt.getTime() - Date.now()) / 3600000)),
    }));

    return { requests: requestsWithTime };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /coach/lead-requests/:id/accept
  // ═══════════════════════════════════════════════════════════
  fastify.post('/lead-requests/:id/accept', async (request, reply) => {
    const coach = (request as any).coach;
    const { id } = request.params as { id: string };

    const leadRequest = await fastify.prisma.leadRequest.findFirst({
      where: {
        id,
        coachId: coach.id,
        status: 'PENDING',
      },
    });

    if (!leadRequest) {
      return reply.code(404).send({ error: 'Lead request not found' });
    }

    // Update lead request
    await fastify.prisma.leadRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Find pending program instance and assign coach
    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        userId: leadRequest.userId,
        status: 'PENDING_PAYMENT',
      },
    });

    if (instance) {
      await fastify.prisma.programInstance.update({
        where: { id: instance.id },
        data: { coachId: coach.id },
      });
    }

    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /coach/lead-requests/:id/decline
  // ═══════════════════════════════════════════════════════════
  fastify.post('/lead-requests/:id/decline', async (request, reply) => {
    const coach = (request as any).coach;
    const { id } = request.params as { id: string };
    const body = leadResponseSchema.parse(request.body);

    const leadRequest = await fastify.prisma.leadRequest.findFirst({
      where: {
        id,
        coachId: coach.id,
        status: 'PENDING',
      },
    });

    if (!leadRequest) {
      return reply.code(404).send({ error: 'Lead request not found' });
    }

    await fastify.prisma.leadRequest.update({
      where: { id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        declineReason: body.reason,
      },
    });

    // TODO: Auto-route to next coach

    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /coach/stats
  // ═══════════════════════════════════════════════════════════
  fastify.get('/stats', async (request, reply) => {
    const coach = (request as any).coach;

    const [activeClients, pendingLeads, earnings] = await Promise.all([
      fastify.prisma.programInstance.count({
        where: { coachId: coach.id, status: 'ACTIVE' },
      }),
      fastify.prisma.leadRequest.count({
        where: { coachId: coach.id, status: 'PENDING' },
      }),
      fastify.prisma.ledgerEntry.aggregate({
        where: { coachId: coach.id, status: 'PAID_OUT' },
        _sum: { coachAmount: true },
      }),
    ]);

    const pendingPayout = await fastify.prisma.ledgerEntry.aggregate({
      where: { coachId: coach.id, status: 'PENDING' },
      _sum: { coachAmount: true },
    });

    return {
      activeClients,
      capacity: coach.maxActiveClients,
      pendingLeads,
      totalEarnings: earnings._sum.coachAmount ?? 0,
      pendingPayout: pendingPayout._sum.coachAmount ?? 0,
    };
  });
};

export default coachRoutes;
