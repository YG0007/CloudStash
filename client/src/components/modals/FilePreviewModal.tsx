import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File, FileWithPath } from "@shared/schema";
import { X, Download, Share2 } from "lucide-react";
import { formatBytes } from "@/lib/file-utils.tsx";
import { format } from "date-fns";
import { useFileOperations } from "@/hooks/useFileOperations";

type FilePreviewModalProps = {
  file: File | null;
  onClose: () => void;
};

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [fileWithContent, setFileWithContent] = useState<FileWithPath | null>(null);
  const [loading, setLoading] = useState(false);
  const { downloadFile } = useFileOperations();
  
  // Fetch file content when file changes
  useEffect(() => {
    if (!file) {
      setFileWithContent(null);
      return;
    }
    
    setLoading(true);
    fetch(`/api/files/${file.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch file content');
        return res.json();
      })
      .then(data => {
        setFileWithContent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching file content:', err);
        setLoading(false);
      });
      
    return () => {
      setFileWithContent(null);
    };
  }, [file]);
  
  const handleDownload = () => {
    if (file) {
      downloadFile(file.id, file.name);
    }
  };
  
  const renderPreview = () => {
    if (!fileWithContent || !fileWithContent.dataUrl) return null;
    
    const { type, dataUrl } = fileWithContent;
    
    if (type.startsWith("image/")) {
      return (
        <img 
          src={dataUrl} 
          alt={fileWithContent.name} 
          className="max-w-full max-h-[500px] object-contain"
        />
      );
    }
    
    if (type.startsWith("video/")) {
      return (
        <video 
          src={dataUrl} 
          controls 
          className="max-w-full max-h-[500px]"
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (type.startsWith("audio/")) {
      return (
        <audio 
          src={dataUrl} 
          controls 
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      );
    }
    
    if (type === "application/pdf") {
      return (
        <div className="w-full h-[500px] flex items-center justify-center border">
          <iframe 
            src={dataUrl} 
            className="w-full h-full"
            title={fileWithContent.name}
          />
        </div>
      );
    }
    
    // Text preview (for code, markdown, etc.)
    if (type.startsWith("text/") || 
        type === "application/json" || 
        type === "application/xml") {
      return (
        <div className="w-full max-h-[500px] overflow-auto bg-gray-100 p-4 rounded">
          <pre className="text-sm">
            <code>
              {/* Display base64 text content (this is simplified) */}
              {dataUrl.includes('base64,') ? 
                atob(dataUrl.split('base64,')[1]) : 
                "Cannot preview this file type"}
            </code>
          </pre>
        </div>
      );
    }
    
    // Generic file preview for unsupported types
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-100 rounded p-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-400 mb-4"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p className="text-gray-500">Preview not available for this file type</p>
        <Button variant="outline" className="mt-4" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };
  
  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex justify-between items-center p-4 border-b">
          <DialogTitle>{file?.name}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-500">Loading preview...</p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded p-2 max-w-full max-h-full">
              {renderPreview()}
            </div>
          )}
        </div>
        
        {fileWithContent && (
          <div className="border-t p-4 bg-gray-50">
            <h4 className="font-medium mb-2">File Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Type</p>
                <p>{fileWithContent.type}</p>
              </div>
              <div>
                <p className="text-gray-500">Size</p>
                <p>{formatBytes(fileWithContent.size)}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p>{format(new Date(fileWithContent.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500">Modified</p>
                <p>{format(new Date(fileWithContent.updatedAt), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
