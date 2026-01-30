import { env } from './config/env.js';
import { buildApp } from './app.js';

async function main() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: parseInt(env.API_PORT),
      host: env.API_HOST,
    });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌙 SOOMI API Server                                     ║
║                                                           ║
║   Server running at: ${address.padEnd(33)}║
║   Environment: ${env.NODE_ENV.padEnd(40)}║
║                                                           ║
║   Routes:                                                 ║
║   • GET  /health                                          ║
║   • POST /auth/magic-link/request                         ║
║   • POST /auth/magic-link/verify                          ║
║   • GET  /auth/me                                         ║
║   • GET  /users/me                                        ║
║   • GET  /sleep/sessions                                  ║
║   • POST /sleep/sessions/manual                           ║
║   • GET  /sleep/summary                                   ║
║   • GET  /programs                                        ║
║   • POST /programs/start                                  ║
║   • GET  /programs/current                                ║
║   • GET  /coach/clients                                   ║
║   • GET  /coach/stats                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
