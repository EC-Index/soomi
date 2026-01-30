import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service.js';
import { emailService } from '../../services/email.service.js';

// Schemas
const requestMagicLinkSchema = z.object({
  email: z.string().email(),
  locale: z.string().default('de-DE'),
});

const verifyMagicLinkSchema = z.object({
  token: z.string().min(1),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  // ═══════════════════════════════════════════════════════════
  // POST /auth/magic-link/request
  // ═══════════════════════════════════════════════════════════
  fastify.post('/magic-link/request', async (request, reply) => {
    const body = requestMagicLinkSchema.parse(request.body);

    const token = await authService.createMagicLink(body.email, body.locale);

    // Send email
    await emailService.sendMagicLink(body.email, token, body.locale);

    return { success: true, message: 'Magic link sent' };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /auth/magic-link/verify
  // ═══════════════════════════════════════════════════════════
  fastify.post('/magic-link/verify', async (request, reply) => {
    const body = verifyMagicLinkSchema.parse(request.body);

    const result = await authService.verifyMagicLink(body.token);

    if (!result) {
      return reply.code(401).send({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // Generate JWT
    const accessToken = fastify.jwt.sign({
      userId: result.userId,
      email: result.email,
      isCoach: result.isCoach,
    });

    // Get user data
    const user = await fastify.prisma.user.findUnique({
      where: { id: result.userId },
      select: {
        id: true,
        email: true,
        locale: true,
        timezone: true,
        dataConsentAt: true,
        createdAt: true,
      },
    });

    return {
      accessToken,
      user,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // GET /auth/me
  // ═══════════════════════════════════════════════════════════
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
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
  // POST /auth/logout
  // ═══════════════════════════════════════════════════════════
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // JWT is stateless, so we just return success
    // Client should delete the token
    return { success: true };
  });
};

export default authRoutes;
