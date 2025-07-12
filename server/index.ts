import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./production-static";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

    console.error('Error:', err);
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (error) {
      console.error("Vite setup failed, falling back to static serving:", error);
      // Static serving for production
      const { serveStatic } = await import("./production-static");
      serveStatic(app);
    }
  } else {
    // Static serving for production
    const { serveStatic } = await import("./production-static");
    serveStatic(app);
  }

  // Use Railway's PORT environment variable or default to 5000
  const port = process.env.PORT || 5000;

  // Additional logging for Railway debugging
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', port);
  console.log('Database URL exists:', !!process.env.DATABASE_URL);
  console.log('Session secret exists:', !!process.env.SESSION_SECRET);
  console.log('Replit domains:', process.env.REPLIT_DOMAINS);
  console.log('Repl ID:', process.env.REPL_ID);
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();