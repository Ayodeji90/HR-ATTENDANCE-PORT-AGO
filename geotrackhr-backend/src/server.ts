import app from './app';
import { config } from '@config/index';
import { logger } from '@utils/logger';

/**
 * Server entry point.
 *
 * Starts the Express HTTP server on the configured port and host.
 * Handles graceful shutdown on SIGTERM/SIGINT signals.
 *
 * The database connection is NOT established here — Knex manages
 * its own connection pool lazily on first query. This keeps the
 * server startup fast and independent of DB availability during
 * initial development.
 */
const server = app.listen(config.app.port, config.app.host, () => {
  logger.info(
    `🚀 GeoTrackHR server started on http://${config.app.host}:${config.app.port}`,
    {
      environment: config.app.nodeEnv,
      port: config.app.port,
    }
  );
});

// ── Graceful shutdown ──────────────────────────────────
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', { error: err.message });
      process.exit(1);
    }

    logger.info('HTTP server closed');
    // Knex pool is destroyed automatically on process exit.
    // If Redis client is added later, disconnect it here.
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled rejections & exceptions ──────────────────
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection', {
    message: reason.message,
    stack: reason.stack,
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — exiting', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});