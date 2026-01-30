import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Schemas
const updateUserSchema = z.object({
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

const consentSchema = z.object({
  dataConsent: z.boolean(),
  marketingConsent: z.boolean().optional(),
});

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ═══════════════════════════════════════════════════════════
  // GET /users/me
  // ═══════════════════════════════════════════════════════════
  fastify.get('/me', async (request, reply) => {
    const { userId } = request.user;

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        locale: true,
        timezone: true,
        dataConsentAt: true,
        marketingConsentAt: true,
        createdAt: true,
        coachProfile: {
          select: {
            id: true,
            displayName: true,
            instagramHandle: true,
            avatarUrl: true,
            languages: true,
            style: true,
            focusTags: true,
            maxActiveClients: true,
            status: true,
            referralCode: true,
          },
        },
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return { user };
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /users/me
  // ═══════════════════════════════════════════════════════════
  fastify.patch('/me', async (request, reply) => {
    const { userId } = request.user;
    const body = updateUserSchema.parse(request.body);

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        email: true,
        locale: true,
        timezone: true,
      },
    });

    return { user };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /users/me/consent
  // ═══════════════════════════════════════════════════════════
  fastify.post('/me/consent', async (request, reply) => {
    const { userId } = request.user;
    const body = consentSchema.parse(request.body);

    const now = new Date();

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        dataConsentAt: body.dataConsent ? now : null,
        marketingConsentAt: body.marketingConsent ? now : null,
      },
      select: {
        id: true,
        dataConsentAt: true,
        marketingConsentAt: true,
      },
    });

    return { user };
  });

  // ═══════════════════════════════════════════════════════════
  // DELETE /users/me (GDPR - Right to Erasure)
  // ═══════════════════════════════════════════════════════════
  fastify.delete('/me', async (request, reply) => {
    const { userId } = request.user;

    // Soft delete - set deletedAt
    await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${userId}@deleted.soomi.app`,
        dataConsentAt: null,
        marketingConsentAt: null,
      },
    });

    // Delete related data
    await fastify.prisma.magicLink.deleteMany({
      where: { userId },
    });

    await fastify.prisma.sleepSessionNormalized.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Account deleted' };
  });
};

export default userRoutes;
