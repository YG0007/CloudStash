import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { File } from "@shared/schema";
import { useFileOperations } from "@/hooks/useFileOperations";
import { Eye, Download, Share2, Pencil, Copy, FolderUp, Trash2 } from "lucide-react";

type FileContextMenuProps = {
  file: File;
  children: React.ReactNode;
  onPreviewClick?: () => void;
  onRenameClick?: () => void;
};

export default function FileContextMenu({ 
  file, 
  children, 
  onPreviewClick,
  onRenameClick 
}: FileContextMenuProps) {
  const { deleteFile, downloadFile } = useFileOperations();
  
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(file.id, file.name);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteFile(file.id);
    }
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onPreviewClick}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Preview</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDownloadClick}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download</span>
        </ContextMenuItem>
        <ContextMenuItem>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Share</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onRenameClick}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy</span>
        </ContextMenuItem>
        <ContextMenuItem>
          <FolderUp className="mr-2 h-4 w-4" />
          <span>Move to</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-red-600" onClick={handleDeleteClick}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
