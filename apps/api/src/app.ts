import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';

// Plugins
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';

// Routes
import authRoutes from './routes/auth/index.js';
import userRoutes from './routes/users/index.js';
import sleepRoutes from './routes/sleep/index.js';
import programRoutes from './routes/program/index.js';
import coachRoutes from './routes/coach/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // PLUGINS
  // ═══════════════════════════════════════════════════════════
  
  // CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  // Sensible (better error handling)
  await fastify.register(sensible);

  // Prisma
  await fastify.register(prismaPlugin);

  // Auth (JWT)
  await fastify.register(authPlugin);

  // ═══════════════════════════════════════════════════════════
  // ROUTES
  // ═══════════════════════════════════════════════════════════

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(sleepRoutes, { prefix: '/sleep' });
  await fastify.register(programRoutes, { prefix: '/programs' });
  await fastify.register(coachRoutes, { prefix: '/coach' });

  // ═══════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════════════

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    // Zod validation errors
    if (error.name === 'ZodError') {
      return reply.code(400).send({
        error: 'Validation Error',
        details: (error as any).errors,
      });
    }

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Resource already exists',
        });
      }
      if (prismaError.code === 'P2025') {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Resource not found',
        });
      }
    }

    // Default error
    const statusCode = error.statusCode ?? 500;
    return reply.code(statusCode).send({
      error: error.name ?? 'Error',
      message: env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    });
  });

  return fastify;
}
