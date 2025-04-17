import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File } from "@shared/schema";
import { X, Copy, Mail, Link2, Facebook, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ShareFileModalProps = {
  file: File | null;
  onClose: () => void;
};

export default function ShareFileModal({ file, onClose }: ShareFileModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  if (!file) return null;
  
  // In a real application, this would be a proper sharing link
  const shareUrl = `${window.location.origin}/shared/file/${file.id}/${encodeURIComponent(file.name)}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = (platform: string) => {
    // In a real app, these would open proper sharing dialogs or APIs
    toast({
      title: `Share via ${platform}`,
      description: `Sharing "${file.name}" via ${platform}. This would open ${platform} sharing in a real app.`,
    });
  };
  
  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="share-dialog-description">
        <DialogHeader>
          <DialogTitle>Share "{file.name}"</DialogTitle>
          <p id="share-dialog-description" className="text-sm text-muted-foreground">
            Share this file with others using a link or via social platforms.
          </p>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Share link</label>
            <div className="flex items-center space-x-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink}
                className={copied ? "bg-green-50 text-green-600 border-green-200" : ""}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Share via</label>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => handleShare('Email')}
                className="bg-red-50 text-red-600 border-red-200"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => handleShare('Link')}
                className="bg-purple-50 text-purple-600 border-purple-200"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => handleShare('Facebook')}
                className="bg-blue-50 text-blue-600 border-blue-200"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => handleShare('Twitter')}
                className="bg-sky-50 text-sky-600 border-sky-200"
              >
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}