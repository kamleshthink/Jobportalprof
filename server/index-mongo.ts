import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { connectToMongoDB } from './mongodb';
import { setupAuth } from './auth-mongo';
import { registerRoutes } from './routes-mongo';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { log, setupVite, serveStatic } from './vite';
import { Server } from 'http';

// Load environment variables
dotenv.config();

// Initialize MongoDB connection
connectToMongoDB()
  .then((connected) => {
    if (!connected) {
      console.error('Failed to connect to MongoDB, exiting application');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Error initializing MongoDB connection:', err);
    process.exit(1);
  });

// Create application directory structure
const uploadsDir = path.join(__dirname, '../uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Create Express application
const app = express();

// Add middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set up authentication
setupAuth(app);

// Create HTTP server and register API routes
let httpServer: Server;

registerRoutes(app).then((server) => {
  httpServer = server;
  
  // Set up development server for client
  if (process.env.NODE_ENV !== 'production') {
    setupVite(app, httpServer).catch((err) => {
      console.error('Failed to setup Vite development server:', err);
    });
  } else {
    // In production, serve the static client files
    serveStatic(app);
  }
  
  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  // Start the server
  const port = process.env.PORT || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    log(`Server running at http://localhost:${port}`);
  });
});