const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { seedDefaultsIfEmpty } = require('./controllers/adminController');

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultsIfEmpty();

    const host = config.host || '0.0.0.0';
    const server = app.listen(config.port, host, () => {
      console.log(`=================================================`);
      console.log(`  AI Research Assistant Backend API Running!`);
      console.log(`  Host: ${host}`);
      console.log(`  Port: http://${host}:${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  Health Check: http://${host}:${config.port}/api/health`);
      console.log(`=================================================`);
    });


    // Graceful Shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] Process terminated.');
      });
    });
  } catch (err) {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
