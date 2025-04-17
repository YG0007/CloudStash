import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FolderPlus, List, LayoutGrid } from "lucide-react";

type ActionBarProps = {
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  viewType: "grid" | "list";
  setViewType: (type: "grid" | "list") => void;
  sortType: "name" | "date" | "size" | "type";
  setSortType: (type: "name" | "date" | "size" | "type") => void;
};

export default function ActionBar({ 
  onUploadClick, 
  onNewFolderClick,
  viewType,
  setViewType,
  sortType,
  setSortType
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center space-x-2">
        <Button 
          onClick={onUploadClick}
          className="bg-primary text-white rounded-lg hover:bg-blue-600 shadow-sm"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span>Upload</span>
        </Button>
        <Button
          onClick={onNewFolderClick}
          variant="outline"
          className="bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          <span>New Folder</span>
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            type="button"
            variant={viewType === "list" ? "default" : "secondary"}
            className={`px-3 py-1.5 h-9 rounded-none ${viewType === "list" ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-blue-50 text-primary"}`}
            onClick={() => setViewType("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewType === "grid" ? "default" : "secondary"}
            className={`px-3 py-1.5 h-9 rounded-none ${viewType === "grid" ? "bg-blue-50 text-primary" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setViewType("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        
        <Select 
          value={sortType} 
          onValueChange={(value) => setSortType(value as any)}
        >
          <SelectTrigger className="w-[120px] border border-gray-300 rounded-lg">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
