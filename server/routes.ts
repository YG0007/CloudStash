import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertFolderSchema } from "@shared/schema";
import multer from "multer";
import { randomUUID } from "crypto";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const memStorage = multer.memoryStorage();
  const upload = multer({
    storage: memStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB file size limit
    }
  });

  // Error handler middleware
  function handleError(err: any, res: Response) {
    console.error(err);
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  }

  // User endpoints
  app.get("/api/user", async (req, res) => {
    try {
      // For demo purposes, get the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      handleError(err, res);
    }
  });

  // File endpoints
  app.get("/api/files", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const folderId = req.query.folderId ? Number(req.query.folderId) : null;
      const files = await storage.getFiles(userId, folderId);
      return res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/files/recent", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const limit = req.query.limit ? Number(req.query.limit) : 4;
      const files = await storage.getRecentFiles(userId, limit);
      return res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/files/:id", async (req, res) => {
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

  app.post("/api/files/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = 1; // Default user for demo
      const folderId = req.body.folderId ? Number(req.body.folderId) : null;
      
      // Check if user has enough storage
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
      
      // Store file data as base64
      const fileContent = req.file.buffer.toString("base64");
      await storage.setFileContent(createdFile.id, `data:${req.file.mimetype};base64,${fileContent}`);
      
      return res.status(201).json(createdFile);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/files/:id", async (req, res) => {
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

  app.delete("/api/files/:id", async (req, res) => {
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

  app.get("/api/files/:id/download", async (req, res) => {
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

      // For base64 data URLs, extract the data part
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

  // Folder endpoints
  app.get("/api/folders", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      const folders = await storage.getFolders(userId, parentId);
      return res.json(folders);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/folders/:id", async (req, res) => {
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

  app.post("/api/folders", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
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

  app.put("/api/folders/:id", async (req, res) => {
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

  app.delete("/api/folders/:id", async (req, res) => {
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
