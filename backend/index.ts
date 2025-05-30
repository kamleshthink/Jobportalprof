import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes-mongo";
import { setupVite, serveStatic, log } from "./vite";
import { connectToMongoDB } from './mongodb';
import { setupAuth } from './auth-mongo';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory in ESM (replaces __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import multer from 'multer';

// Initialize MongoDB connection - with better error handling
console.log('Attempting to connect to MongoDB...');
connectToMongoDB()
  .then((connected) => {
    if (connected) {
      console.log('MongoDB connection established successfully, continue with application startup');
    } else {
      console.error('Failed to connect to MongoDB, but continuing with application startup in development mode');
      // Don't exit in development mode - we'll handle database errors gracefully
      if (process.env.NODE_ENV === 'production') {
        console.error('In production mode, exiting application due to MongoDB connection failure');
        process.exit(1);
      }
    }
  })
  .catch((err) => {
    console.error('Error initializing MongoDB connection:', err);
    // Don't exit in development mode - we'll handle database errors gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('In production mode, exiting application due to MongoDB connection error');
      process.exit(1);
    }
  });

// Create application directory structure for uploads
const uploadsDir = path.join(__dirname, '../uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route for server check
app.get("/test", (req, res) => {
  res.send("Server is working!");
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set up auth (required before routes)
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  // Serve static files from the frontend build directory
  const frontendBuildPath = path.join(__dirname, "..", "dist", "client");
  app.use(express.static(frontendBuildPath));

  // Catch-all route to serve index.html for SPAs
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });

  // ALWAYS serve the app on port 5001
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
