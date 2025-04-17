import { Folder } from "@shared/schema";
import { FolderIcon, MoreVertical, Eye, Share2, Pencil, Copy, FolderUp, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { File } from "@shared/schema";
import { formatBytes } from "@/lib/file-utils.tsx";

type FolderCardProps = {
  folder: Folder;
  viewType: "grid" | "list";
  onClick?: () => void;
  onRenameClick?: () => void;
};

export default function FolderCard({ folder, viewType, onClick, onRenameClick }: FolderCardProps) {
  // Get files in this folder to show count and size
  const { data: folderFiles = [] } = useQuery<File[]>({
    queryKey: ['/api/files', { folderId: folder.id }],
    queryFn: async () => {
      const response = await fetch(`/api/files?folderId=${folder.id}`);
      if (!response.ok) throw new Error('Failed to fetch folder files');
      return response.json();
    }
  });
  
  const fileCount = folderFiles.length;
  const totalSize = folderFiles.reduce((acc, file) => acc + file.size, 0);
  
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRenameClick?.();
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
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-gray-500 hover:text-gray-700 p-1">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onClick}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Open</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
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
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="h-24 flex items-center justify-center mb-3">
          <FolderIcon className="h-16 w-16 text-yellow-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 truncate" title={folder.name}>
            {folder.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} • {formatBytes(totalSize)}
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
        <FolderIcon className="h-10 w-10 text-yellow-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate" title={folder.name}>
          {folder.name}
        </h3>
        <p className="text-xs text-gray-500">
          {fileCount} {fileCount === 1 ? 'file' : 'files'} • {formatBytes(totalSize)}
        </p>
      </div>
      
      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Open</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
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
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
