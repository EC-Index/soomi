import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { checkProgramEligibility, recommendPrograms } from '@soomi/domain';

// Schemas
const startProgramSchema = z.object({
  templateSlug: z.string().optional(),
  variantSlug: z.string().optional(),
  referralCode: z.string().optional(),
  promoCode: z.string().optional(),
});

const checkInSchema = z.object({
  answers: z.record(z.union([z.number(), z.boolean(), z.string()])),
  notes: z.string().max(500).optional(),
});

const programRoutes: FastifyPluginAsync = async (fastify) => {
  // ═══════════════════════════════════════════════════════════
  // GET /programs - List available programs
  // ═══════════════════════════════════════════════════════════
  fastify.get('/', {
    preHandler: [fastify.authenticateOptional],
  }, async (request, reply) => {
    const templates = await fastify.prisma.programTemplate.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    let recommendations = undefined;

    if (request.user) {
      const [completedPrograms, activeProgram, user] = await Promise.all([
        fastify.prisma.programInstance.findMany({
          where: { userId: request.user.userId, status: 'COMPLETED' },
          include: { template: true },
        }),
        fastify.prisma.programInstance.findFirst({
          where: { userId: request.user.userId, status: 'ACTIVE' },
        }),
        fastify.prisma.user.findUnique({
          where: { id: request.user.userId },
        }),
      ]);

      if (user) {
        recommendations = recommendPrograms({
          user: user as any,
          templates: templates as any,
          completedPrograms: completedPrograms as any,
          activeProgram: activeProgram as any,
        });
      }
    }

    return {
      programs: templates,
      recommendations,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /programs/:slug
  // ═══════════════════════════════════════════════════════════
  fastify.get('/:slug', {
    preHandler: [fastify.authenticateOptional],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const template = await fastify.prisma.programTemplate.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true } },
      },
    });

    if (!template) {
      return reply.code(404).send({ error: 'Program not found' });
    }

    let eligibility = undefined;

    if (request.user) {
      const [completedPrograms, activeProgram, user] = await Promise.all([
        fastify.prisma.programInstance.findMany({
          where: { userId: request.user.userId, status: 'COMPLETED' },
          include: { template: true },
        }),
        fastify.prisma.programInstance.findFirst({
          where: { userId: request.user.userId, status: 'ACTIVE' },
        }),
        fastify.prisma.user.findUnique({
          where: { id: request.user.userId },
        }),
      ]);

      if (user) {
        eligibility = checkProgramEligibility({
          user: user as any,
          template: template as any,
          completedPrograms: completedPrograms as any,
          activeProgram: activeProgram as any,
        });
      }
    }

    return {
      program: template,
      eligibility,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /programs/current - Get user's current program
  // ═══════════════════════════════════════════════════════════
  fastify.get('/current', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
      },
      include: {
        template: true,
        days: {
          include: {
            actionTemplate: true,
            checkIn: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        coach: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return { instance };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /programs/start
  // ═══════════════════════════════════════════════════════════
  fastify.post('/start', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const body = startProgramSchema.parse(request.body);

    // Default to sleep-reset-14
    const templateSlug = body.templateSlug || 'sleep-reset-14';

    // Get template
    const template = await fastify.prisma.programTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template || !template.isActive) {
      return reply.code(404).send({ error: 'Program not found' });
    }

    // Check eligibility
    const [completedPrograms, activeProgram, user] = await Promise.all([
      fastify.prisma.programInstance.findMany({
        where: { userId, status: 'COMPLETED' },
        include: { template: true },
      }),
      fastify.prisma.programInstance.findFirst({
        where: { userId, status: 'ACTIVE' },
      }),
      fastify.prisma.user.findUnique({
        where: { id: userId },
      }),
    ]);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const eligibility = checkProgramEligibility({
      user: user as any,
      template: template as any,
      completedPrograms: completedPrograms as any,
      activeProgram: activeProgram as any,
    });

    if (!eligibility.eligible) {
      return reply.code(400).send({
        error: 'Not eligible for this program',
        reasons: eligibility.reasons,
      });
    }

    // Get variant price if provided
    let finalPrice = template.priceEuroCents;
    let variantId = null;

    if (body.promoCode) {
      const variant = await fastify.prisma.programVariant.findUnique({
        where: { promoCode: body.promoCode },
      });
      if (variant && variant.templateId === template.id && variant.isActive) {
        finalPrice = variant.priceEuroCents;
        variantId = variant.id;
      }
    }

    // Create config snapshot
    const configSnapshot = {
      durationDays: template.durationDays,
      coachIntensity: template.coachIntensity,
      coachRequired: template.coachRequired,
      allowedActionIds: template.allowedActionIds,
      checkInConfig: template.checkInConfig,
      reportType: template.reportType,
    };

    // Create instance
    const instance = await fastify.prisma.programInstance.create({
      data: {
        userId,
        templateId: template.id,
        variantId,
        configSnapshot,
        status: 'PENDING_PAYMENT',
      },
      include: {
        template: true,
      },
    });

    // Handle referral attribution
    if (body.referralCode) {
      const coach = await fastify.prisma.coachProfile.findUnique({
        where: { referralCode: body.referralCode },
      });

      if (coach) {
        await fastify.prisma.attribution.upsert({
          where: { userId },
          create: {
            userId,
            source: 'COACH_LINK',
            referralCode: body.referralCode,
            coachId: coach.id,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
          update: {
            source: 'COACH_LINK',
            referralCode: body.referralCode,
            coachId: coach.id,
            attributedAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // TODO: Generate Stripe payment URL
    const paymentUrl = `https://checkout.stripe.com/placeholder?instance=${instance.id}&amount=${finalPrice}`;

    return {
      instance,
      paymentUrl,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /programs/day/:dayNumber
  // ═══════════════════════════════════════════════════════════
  fastify.get('/day/:dayNumber', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { dayNumber } = request.params as { dayNumber: string };

    const instance = await fastify.prisma.programInstance.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'No active program' });
    }

    const day = await fastify.prisma.programDay.findUnique({
      where: {
        programInstanceId_dayNumber: {
          programInstanceId: instance.id,
          dayNumber: parseInt(dayNumber),
        },
      },
      include: {
        actionTemplate: true,
        checkIn: true,
      },
    });

    if (!day) {
      return reply.code(404).send({ error: 'Day not found' });
    }

    return { day };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /programs/day/:dayNumber/check-in
  // ═══════════════════════════════════════════════════════════
  fastify.post('/day/:dayNumber/check-in', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { dayNumber } = request.params as { dayNumber: string };
    const body = checkInSchema.parse(request.body);

    const instance = await fastify.prisma.programInstance.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'No active program' });
    }

    const day = await fastify.prisma.programDay.findUnique({
      where: {
        programInstanceId_dayNumber: {
          programInstanceId: instance.id,
          dayNumber: parseInt(dayNumber),
        },
      },
    });

    if (!day) {
      return reply.code(404).send({ error: 'Day not found' });
    }

    // Create or update check-in
    const checkIn = await fastify.prisma.dailyCheckIn.upsert({
      where: { programDayId: day.id },
      create: {
        programDayId: day.id,
        answers: body.answers,
        notes: body.notes,
      },
      update: {
        answers: body.answers,
        notes: body.notes,
        completedAt: new Date(),
      },
    });

    return { checkIn };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /programs/day/:dayNumber/action-complete
  // ═══════════════════════════════════════════════════════════
  fastify.post('/day/:dayNumber/action-complete', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { dayNumber } = request.params as { dayNumber: string };

    const instance = await fastify.prisma.programInstance.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'No active program' });
    }

    const day = await fastify.prisma.programDay.update({
      where: {
        programInstanceId_dayNumber: {
          programInstanceId: instance.id,
          dayNumber: parseInt(dayNumber),
        },
      },
      data: {
        actionCompletedAt: new Date(),
      },
      include: {
        actionTemplate: true,
      },
    });

    return { day };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /programs/report
  // ═══════════════════════════════════════════════════════════
  fastify.get('/report', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const instance = await fastify.prisma.programInstance.findFirst({
      where: {
        userId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        report: true,
        template: true,
      },
    });

    if (!instance) {
      return reply.code(404).send({ error: 'No program found' });
    }

    return {
      report: instance.report,
      program: instance.template,
      status: instance.status,
    };
  });
};

export default programRoutes;
