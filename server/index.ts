import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createOgMiddleware } from "./og-middleware";
import { captureServerError, shutdownErrorTracking } from "./errorTracking";

const app = express();

app.use(cookieParser());
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
    requestId: string;
    startTime: number;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Request ID middleware — assigns a unique ID and start time to every request
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  req.startTime = Date.now();
  next();
});

// Set X-Request-Id header on all responses
app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', _req.requestId);
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
        // Redact sensitive data from logs
        const safeResponse = { ...capturedJsonResponse };
        const sensitiveKeys = ['ledewireToken', 'access_token', 'refresh_token', 'password', 'ledewireAccessToken', 'ledewireRefreshToken', 'adminToken'];
        sensitiveKeys.forEach(key => {
          if (key in safeResponse) {
            safeResponse[key] = '[REDACTED]';
          }
        });
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    captureServerError(err, {
      endpoint: _req.path,
      method: _req.method,
      statusCode: status,
      requestId: _req.requestId,
      duration: _req.startTime ? Date.now() - _req.startTime : undefined,
    });

    res.status(status).json({ message, requestId: _req.requestId });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // Add OG middleware for development (for crawler detection)
    app.use(createOgMiddleware());
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  
  // Use 0.0.0.0 for Replit/production, localhost for local development
  // reusePort is not supported on macOS, so only use it on Replit
  const isReplit = !!process.env.REPL_ID;
  const host = isReplit ? "0.0.0.0" : "localhost";
  const listenOptions: any = { port, host };

  // Only use reusePort on Replit (not supported on macOS)
  if (isReplit) {
    listenOptions.reusePort = true;
  }

  httpServer.listen(
    listenOptions,
    () => {
      log(`serving on ${host}:${port}`);
    },
  );

  // Graceful shutdown — flush PostHog events
  process.on('SIGTERM', async () => {
    await shutdownErrorTracking();
    process.exit(0);
  });
})();
