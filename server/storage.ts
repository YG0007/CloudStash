import { files, folders, users, type User, type InsertUser, type File, type InsertFile, type Folder, type InsertFolder, type FileWithPath } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStorageUsed(userId: number, bytesChange: number): Promise<User>;
  
  // File operations
  getFiles(userId: number, folderId?: number | null): Promise<File[]>;
  getRecentFiles(userId: number, limit: number): Promise<File[]>;
  getFileById(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<File>): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  getFileContent(id: number): Promise<string | undefined>;
  setFileContent(id: number, content: string): Promise<boolean>;
  
  // Folder operations
  getFolders(userId: number, parentId?: number | null): Promise<Folder[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, updates: Partial<Folder>): Promise<Folder>;
  deleteFolder(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File & { content?: string }>;
  private folders: Map<number, Folder>;
  private userIdCounter: number;
  private fileIdCounter: number;
  private folderIdCounter: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.folders = new Map();
    this.userIdCounter = 1;
    this.fileIdCounter = 1;
    this.folderIdCounter = 1;
    
    // Create default user
    this.createUser({
      username: "demo",
      password: "password"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      storageLimit: 104857600, // 100MB
      storageUsed: 0 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStorageUsed(userId: number, bytesChange: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    user.storageUsed = Math.max(0, user.storageUsed + bytesChange);
    this.users.set(userId, user);
    return user;
  }

  // File operations
  async getFiles(userId: number, folderId?: number | null): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId && 
                file.folderId === folderId && 
                !file.isDeleted
    );
  }

  async getRecentFiles(userId: number, limit: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter((file) => file.userId === userId && !file.isDeleted)
      .sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, limit);
  }

  async getFileById(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = {
      ...insertFile,
      id,
      createdAt: now,
      updatedAt: now,
      isStarred: false,
      isDeleted: false
    };
    this.files.set(id, file);
    
    // Update user storage usage
    await this.updateUserStorageUsed(insertFile.userId, insertFile.size);
    
    return file;
  }

  async updateFile(id: number, updates: Partial<File>): Promise<File> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error(`File not found with ID: ${id}`);
    }
    
    const oldSize = file.size;
    const updatedFile = { ...file, ...updates, updatedAt: new Date() };
    this.files.set(id, updatedFile as File & { content?: string });
    
    // If size changed, update user storage
    if (updates.size && updates.size !== oldSize) {
      await this.updateUserStorageUsed(file.userId, updates.size - oldSize);
    }
    
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const file = await this.getFileById(id);
    if (!file) return false;
    
    // Mark as deleted instead of removing entirely
    const updatedFile = { ...file, isDeleted: true, updatedAt: new Date() };
    this.files.set(id, updatedFile as File & { content?: string });
    
    // Update user storage usage
    await this.updateUserStorageUsed(file.userId, -file.size);
    
    return true;
  }

  async getFileContent(id: number): Promise<string | undefined> {
    const file = this.files.get(id);
    return file?.content;
  }

  async setFileContent(id: number, content: string): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) return false;
    
    file.content = content;
    return true;
  }

  // Folder operations
  async getFolders(userId: number, parentId?: number | null): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId && 
                 folder.parentId === parentId && 
                 !folder.isDeleted
    );
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const now = new Date();
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(id: number, updates: Partial<Folder>): Promise<Folder> {
    const folder = await this.getFolderById(id);
    if (!folder) {
      throw new Error(`Folder not found with ID: ${id}`);
    }
    
    const updatedFolder = { ...folder, ...updates, updatedAt: new Date() };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<boolean> {
    const folder = await this.getFolderById(id);
    if (!folder) return false;
    
    // Mark folder as deleted
    const updatedFolder = { ...folder, isDeleted: true, updatedAt: new Date() };
    this.folders.set(id, updatedFolder);
    
    // Mark all files in this folder as deleted
    for (const file of this.files.values()) {
      if (file.folderId === id && !file.isDeleted) {
        await this.deleteFile(file.id);
      }
    }
    
    // Recursively delete subfolders
    for (const subfolder of this.folders.values()) {
      if (subfolder.parentId === id && !subfolder.isDeleted) {
        await this.deleteFolder(subfolder.id);
      }
    }
    
    return true;
  }
}

export const storage = new MemStorage();
