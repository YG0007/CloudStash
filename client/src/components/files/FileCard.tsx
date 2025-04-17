import { useState } from "react";
import { File } from "@shared/schema";
import { formatBytes, getFileIcon } from "@/lib/file-utils.tsx";
import { formatDistanceToNow } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Download, Share2, Pencil, Copy, FolderUp, Trash2 } from "lucide-react";
import { useFileOperations } from "@/hooks/useFileOperations";

type FileCardProps = {
  file: File;
  viewType: "grid" | "list";
  onClick?: () => void;
  onRenameClick?: () => void;
  onShareClick?: () => void;
};

export default function FileCard({ file, viewType, onClick, onRenameClick, onShareClick }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteFile, downloadFile } = useFileOperations();
  
  const fileIcon = getFileIcon(file.type);
  const fileDate = formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true });
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteFile(file.id);
    }
  };
  
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(file.id, file.name);
  };
  
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRenameClick?.();
  };
  
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.();
  };
  
  // Grid view
  if (viewType === "grid") {
    return (
      <div 
        className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col relative group cursor-pointer"
        onClick={onClick}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <button className="text-gray-500 hover:text-gray-700 p-1">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onClick}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadClick}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareClick}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRenameClick}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FolderUp className="mr-2 h-4 w-4" />
                <span>Move to</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDeleteClick}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="h-24 flex items-center justify-center mb-3">
          {fileIcon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 truncate" title={file.name}>
            {file.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatBytes(file.size)} • {fileDate}
          </p>
        </div>
      </div>
    );
  }
  
  // List view
  return (
    <div 
      className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow flex items-center group cursor-pointer"
      onClick={onClick}
    >
      <div className="mr-3">
        {fileIcon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate" title={file.name}>
          {file.name}
        </h3>
        <p className="text-xs text-gray-500">
          {formatBytes(file.size)} • {fileDate}
        </p>
      </div>
      
      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleMenuClick}>
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Preview</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadClick}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareClick}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRenameClick}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FolderUp className="mr-2 h-4 w-4" />
              <span>Move to</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
