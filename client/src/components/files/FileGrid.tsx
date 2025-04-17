import { useMemo } from "react";
import { File, Folder } from "@shared/schema";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

type FileGridProps = {
  files?: File[];
  folders?: Folder[];
  viewType: "grid" | "list";
  sortType: "name" | "date" | "size" | "type";
  onFileClick?: (file: File) => void;
  onFolderClick?: (folder: Folder) => void;
  onRenameClick?: (file: File) => void;
  onRenameFolderClick?: (folder: Folder) => void;
  onShareClick?: (file: File) => void;
};

export default function FileGrid({ 
  files = [], 
  folders = [], 
  viewType, 
  sortType,
  onFileClick,
  onFolderClick,
  onRenameClick,
  onRenameFolderClick,
  onShareClick
}: FileGridProps) {
  // Sort files based on sortType
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      switch (sortType) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "size":
          return b.size - a.size;
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }, [files, sortType]);

  // Sort folders based on sortType (folders can only be sorted by name or date)
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      switch (sortType) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [folders, sortType]);

  return (
    <div className={
      viewType === "grid"
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        : "space-y-2"
    }>
      {sortedFolders.map((folder) => (
        <FolderCard
          key={`folder-${folder.id}`}
          folder={folder}
          viewType={viewType}
          onClick={() => onFolderClick?.(folder)}
          onRenameClick={() => onRenameFolderClick?.(folder)}
        />
      ))}
      
      {sortedFiles.map((file) => (
        <FileCard
          key={`file-${file.id}`}
          file={file}
          viewType={viewType}
          onClick={() => onFileClick?.(file)}
          onRenameClick={() => onRenameClick?.(file)}
          onShareClick={() => onShareClick?.(file)}
        />
      ))}
    </div>
  );
}
