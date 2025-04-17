import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/useUpload";
import { getFileIcon, formatBytes } from "@/lib/file-utils.tsx";
import { X } from "lucide-react";

type UploadProgressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  uploads: ReturnType<typeof useUpload>["uploads"];
};

export default function UploadProgressModal({ isOpen, onClose, uploads }: UploadProgressModalProps) {
  const inProgressUploads = uploads.filter(u => u.status === "uploading");
  const completedUploads = uploads.filter(u => u.status === "completed");
  const failedUploads = uploads.filter(u => u.status === "error");
  
  const totalFiles = uploads.length;
  const completedFiles = completedUploads.length;
  
  const totalBytes = uploads.reduce((acc, upload) => acc + upload.file.size, 0);
  const uploadedBytes = completedUploads.reduce((acc, upload) => acc + upload.file.size, 0) + 
                      inProgressUploads.reduce((acc, upload) => acc + (upload.file.size * (upload.progress / 100)), 0);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploading Files</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="border rounded-lg p-3">
              <div className="flex items-center mb-2">
                {getFileIcon(upload.file.type, 18)}
                <div className="flex-1 overflow-hidden ml-3">
                  <p className="truncate">{upload.file.name}</p>
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {upload.status === "uploading" ? `${Math.round(upload.progress)}%` : 
                   upload.status === "completed" ? "100%" : 
                   "Failed"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    upload.status === "error" ? "bg-red-500" : "bg-primary"
                  }`}
                  style={{ width: `${upload.status === "completed" ? 100 : upload.progress}%` }}
                ></div>
              </div>
              {upload.status === "error" && (
                <p className="text-xs text-red-500 mt-1">{upload.error || "Upload failed"}</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">
              {completedFiles} of {totalFiles} files uploaded
            </p>
            <p className="text-xs text-gray-400">
              {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            {inProgressUploads.length > 0 ? "Cancel" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
