import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index';
import { connectDB } from './db/connection';
import { setupScheduler } from './scheduler/cron';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Monitoring/Health Check for Render
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const start = async () => {
  try {
    await connectDB();
    
    // Initialize automation
    setupScheduler();
    
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
