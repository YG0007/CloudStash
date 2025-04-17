// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  files;
  folders;
  userIdCounter;
  fileIdCounter;
  folderIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.files = /* @__PURE__ */ new Map();
    this.folders = /* @__PURE__ */ new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.folderIdCounter = 1;
    this.createUser({
      username: "demo",
      password: "password"
    });
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const user = {
      ...insertUser,
      id,
      storageLimit: 104857600,
      // 100MB
      storageUsed: 0
    };
    this.users.set(id, user);
    return user;
  }
  async updateUserStorageUsed(userId, bytesChange) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    user.storageUsed = Math.max(0, user.storageUsed + bytesChange);
    this.users.set(userId, user);
    return user;
  }
  // File operations
  async getFiles(userId, folderId) {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && file.folderId === folderId && !file.isDeleted
    );
  }
  async getRecentFiles(userId, limit) {
    return Array.from(this.files.values()).filter((file) => file.userId === userId && !file.isDeleted).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }).slice(0, limit);
  }
  async getFileById(id) {
    return this.files.get(id);
  }
  async createFile(insertFile) {
    const id = this.fileIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const file = {
      ...insertFile,
      id,
      createdAt: now,
      updatedAt: now,
      isStarred: false,
      isDeleted: false
    };
    this.files.set(id, file);
    await this.updateUserStorageUsed(insertFile.userId, insertFile.size);
    return file;
  }
  async updateFile(id, updates) {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File not found with ID: ${id}`);
    }
    const oldSize = file.size;
    const updatedFile = { ...file, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.files.set(id, updatedFile);
    if (updates.size && updates.size !== oldSize) {
      await this.updateUserStorageUsed(file.userId, updates.size - oldSize);
    }
    return updatedFile;
  }
  async deleteFile(id) {
    const file = await this.getFileById(id);
    if (!file) return false;
    const updatedFile = { ...file, isDeleted: true, updatedAt: /* @__PURE__ */ new Date() };
    this.files.set(id, updatedFile);
    await this.updateUserStorageUsed(file.userId, -file.size);
    return true;
  }
  async getFileContent(id) {
    const file = this.files.get(id);
    return file?.content;
  }
  async setFileContent(id, content) {
    const file = this.files.get(id);
    if (!file) return false;
    file.content = content;
    return true;
  }
  // Folder operations
  async getFolders(userId, parentId) {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId && folder.parentId === parentId && !folder.isDeleted
    );
  }
  async getFolderById(id) {
    return this.folders.get(id);
  }
  async createFolder(insertFolder) {
    const id = this.folderIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const folder = {
      ...insertFolder,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };
    this.folders.set(id, folder);
    return folder;
  }
  async updateFolder(id, updates) {
    const folder = await this.getFolderById(id);
    if (!folder) {
      throw new Error(`Folder not found with ID: ${id}`);
    }
    const updatedFolder = { ...folder, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  async deleteFolder(id) {
    const folder = await this.getFolderById(id);
    if (!folder) return false;
    const updatedFolder = { ...folder, isDeleted: true, updatedAt: /* @__PURE__ */ new Date() };
    this.folders.set(id, updatedFolder);
    for (const file of this.files.values()) {
      if (file.folderId === id && !file.isDeleted) {
        await this.deleteFile(file.id);
      }
    }
    for (const subfolder of this.folders.values()) {
      if (subfolder.parentId === id && !subfolder.isDeleted) {
        await this.deleteFolder(subfolder.id);
      }
    }
    return true;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  storageLimit: integer("storage_limit").notNull().default(104857600),
  // 100MB in bytes
  storageUsed: integer("storage_used").notNull().default(0)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false)
});
var insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
  parentId: true
});
var files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  path: text("path"),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isStarred: boolean("is_starred").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false)
});
var insertFileSchema = createInsertSchema(files).pick({
  name: true,
  type: true,
  size: true,
  path: true,
  userId: true,
  folderId: true
});

// server/routes.ts
import multer from "multer";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
async function registerRoutes(app2) {
  const memStorage = multer.memoryStorage();
  const upload = multer({
    storage: memStorage,
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB file size limit
    }
  });
  function handleError(err, res) {
    console.error(err);
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
  app2.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/files", async (req, res) => {
    try {
      const userId = 1;
      const folderId = req.query.folderId ? Number(req.query.folderId) : null;
      const files2 = await storage.getFiles(userId, folderId);
      return res.json(files2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/files/recent", async (req, res) => {
    try {
      const userId = 1;
      const limit = req.query.limit ? Number(req.query.limit) : 4;
      const files2 = await storage.getRecentFiles(userId, limit);
      return res.json(files2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      const content = await storage.getFileContent(fileId);
      return res.json({
        ...file,
        dataUrl: content
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/files/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const userId = 1;
      const folderId = req.body.folderId ? Number(req.body.folderId) : null;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.storageUsed + req.file.size > user.storageLimit) {
        return res.status(400).json({ message: "Storage limit exceeded" });
      }
      const fileData = insertFileSchema.parse({
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: randomUUID(),
        userId,
        folderId
      });
      const createdFile = await storage.createFile(fileData);
      const fileContent = req.file.buffer.toString("base64");
      await storage.setFileContent(createdFile.id, `data:${req.file.mimetype};base64,${fileContent}`);
      return res.status(201).json(createdFile);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.put("/api/files/:id", async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      const updates = req.body;
      const updatedFile = await storage.updateFile(fileId, updates);
      return res.json(updatedFile);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.delete("/api/files/:id", async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const success = await storage.deleteFile(fileId);
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }
      return res.json({ message: "File deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/files/:id/download", async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      const content = await storage.getFileContent(fileId);
      if (!content) {
        return res.status(404).json({ message: "File content not found" });
      }
      const matches = content.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(500).json({ message: "Invalid file content format" });
      }
      const dataBuffer = Buffer.from(matches[2], "base64");
      res.setHeader("Content-Type", matches[1] || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
      return res.send(dataBuffer);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/folders", async (req, res) => {
    try {
      const userId = 1;
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      const folders2 = await storage.getFolders(userId, parentId);
      return res.json(folders2);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/folders/:id", async (req, res) => {
    try {
      const folderId = Number(req.params.id);
      const folder = await storage.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      return res.json(folder);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/folders", async (req, res) => {
    try {
      const userId = 1;
      const folderData = insertFolderSchema.parse({
        ...req.body,
        userId
      });
      const createdFolder = await storage.createFolder(folderData);
      return res.status(201).json(createdFolder);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.put("/api/folders/:id", async (req, res) => {
    try {
      const folderId = Number(req.params.id);
      const folder = await storage.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      const updates = req.body;
      const updatedFolder = await storage.updateFolder(folderId, updates);
      return res.json(updatedFolder);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.delete("/api/folders/:id", async (req, res) => {
    try {
      const folderId = Number(req.params.id);
      const success = await storage.deleteFolder(folderId);
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }
      return res.json({ message: "Folder deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "127.0.0.1"
    // or process.env.HOST
  }, () => {
    log(`serving on http://127.0.0.1:${port}`);
  });
})();
