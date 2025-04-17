import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom request logger (optional)
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      const logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
    return originalJson.call(this, body);
  };

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling
  app.use((err: any, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // Static/Vite handling
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ IMPORTANT: Use PORT from Render and bind to 0.0.0.0
  const port = process.env.PORT || 5000;

  server.listen(port, () => {
    log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
