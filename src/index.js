import express from 'express';
import { config } from './config.js';
import { initDatabase } from './database.js';
import rankingsRouter from './routes/rankings.js';
import wrestlersRouter from './routes/wrestlers.js';
import userRouter from './routes/user.js';
import scraperRouter from './routes/scraper.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Wrestling Data API',
    version: '1.0.0',
    endpoints: '/api/v1'
  });
});

// Routes
app.use('/api/v1', rankingsRouter);
app.use('/api/v1', wrestlersRouter);
app.use('/api/v1', userRouter);
app.use('/api/v1', scraperRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();

    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`Visit http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
