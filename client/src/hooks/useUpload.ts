import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

type UploadStatus = "uploading" | "completed" | "error";

type UploadInfo = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
};

export function useUpload(currentFolderId: number | null) {
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const uploadFile = useCallback(async (file: File, folderId: number | null) => {
    const uploadId = uuidv4();
    
    // Create upload info entry
    const uploadInfo: UploadInfo = {
      id: uploadId,
      file,
      progress: 0,
      status: "uploading"
    };
    
    // Add to uploads array
    setUploads(prev => [...prev, uploadInfo]);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      if (folderId !== null) {
        formData.append("folderId", folderId.toString());
      }
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          
          setUploads(prev => 
            prev.map(u => 
              u.id === uploadId ? { ...u, progress } : u
            )
          );
        }
      });
      
      // Set up promise to handle the upload
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Update status to completed
            setUploads(prev => 
              prev.map(u => 
                u.id === uploadId ? { ...u, status: "completed", progress: 100 } : u
              )
            );
            resolve();
          } else {
            // Handle error
            const errorMsg = `Upload failed: ${xhr.statusText || "Unknown error"}`;
            setUploads(prev => 
              prev.map(u => 
                u.id === uploadId ? { ...u, status: "error", error: errorMsg } : u
              )
            );
            reject(new Error(errorMsg));
          }
        };
        
        xhr.onerror = function() {
          const errorMsg = "Network error during upload";
          setUploads(prev => 
            prev.map(u => 
              u.id === uploadId ? { ...u, status: "error", error: errorMsg } : u
            )
          );
          reject(new Error(errorMsg));
        };
      });
      
      // Start upload
      xhr.open("POST", "/api/files/upload", true);
      xhr.send(formData);
      
      await uploadPromise;
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
    } catch (error) {
      // This will catch any errors not handled above
      console.error("Upload error:", error);
      
      // Show toast for error
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);
  
  const uploadFiles = useCallback((files: File[]) => {
    Array.from(files).forEach(file => {
      uploadFile(file, currentFolderId);
    });
  }, [uploadFile, currentFolderId]);
  
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status === "uploading"));
  }, []);
  
  return {
    uploadFile,
    uploadFiles,
    uploads,
    clearCompleted
  };
}
