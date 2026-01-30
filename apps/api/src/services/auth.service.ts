import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';
import { env } from '../config/env.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  // Generate magic link token
  generateMagicToken(): string {
    const token = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', env.MAGIC_LINK_SECRET)
      .update(token)
      .digest('hex');
    return `${token}.${signature}`;
  }

  // Verify magic link token signature
  verifyMagicTokenSignature(fullToken: string): string | null {
    const [token, signature] = fullToken.split('.');
    if (!token || !signature) return null;

    const expectedSignature = createHmac('sha256', env.MAGIC_LINK_SECRET)
      .update(token)
      .digest('hex');

    if (signature !== expectedSignature) return null;
    return token;
  }

  // Create magic link
  async createMagicLink(email: string, locale: string = 'de-DE'): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          locale,
        },
      });
    }

    // Generate token
    const fullToken = this.generateMagicToken();
    const [token] = fullToken.split('.');

    // Calculate expiry (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing unused magic links for this user
    await this.prisma.magicLink.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Create magic link record
    await this.prisma.magicLink.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return fullToken;
  }

  // Verify magic link and return user
  async verifyMagicLink(fullToken: string): Promise<{ userId: string; email: string; isCoach: boolean } | null> {
    const token = this.verifyMagicTokenSignature(fullToken);
    if (!token) return null;

    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            coachProfile: true,
          },
        },
      },
    });

    if (!magicLink) return null;
    if (magicLink.usedAt) return null;
    if (magicLink.expiresAt < new Date()) return null;

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Update emailVerified
    await this.prisma.user.update({
      where: { id: magicLink.userId },
      data: { emailVerified: new Date() },
    });

    return {
      userId: magicLink.user.id,
      email: magicLink.user.email,
      isCoach: !!magicLink.user.coachProfile,
    };
  }
}
