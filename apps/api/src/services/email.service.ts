import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        secure: env.SMTP_PORT === '465',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.transporter) {
      // Development: Log to console
      console.log('\n📧 Email (dev mode):');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text: ${options.text}`);
      console.log('');
      return;
    }

    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async sendMagicLink(email: string, token: string, locale: string = 'de-DE'): Promise<void> {
    const magicLink = `${env.APP_URL}/auth/verify?token=${token}`;

    const isGerman = locale.startsWith('de');

    const subject = isGerman ? 'Dein Soomi Login-Link' : 'Your Soomi Login Link';

    const text = isGerman
      ? `Hallo!\n\nKlicke auf diesen Link um dich einzuloggen:\n${magicLink}\n\nDer Link ist 15 Minuten gültig.\n\nDein Soomi Team`
      : `Hello!\n\nClick this link to log in:\n${magicLink}\n\nThis link expires in 15 minutes.\n\nYour Soomi Team`;

    const html = isGerman
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hallo!</h2>
          <p>Klicke auf den Button um dich einzuloggen:</p>
          <a href="${magicLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Einloggen
          </a>
          <p style="color: #666; font-size: 14px;">Der Link ist 15 Minuten gültig.</p>
          <p style="color: #666; font-size: 14px;">Dein Soomi Team</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello!</h2>
          <p>Click the button to log in:</p>
          <a href="${magicLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Log In
          </a>
          <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">Your Soomi Team</p>
        </div>
      `;

    await this.send({ to: email, subject, text, html });
  }
}

export const emailService = new EmailService();
