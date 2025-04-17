import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileMenu from "@/components/layout/MobileMenu";
import ActionBar from "@/components/files/ActionBar";
import FileGrid from "@/components/files/FileGrid";
import UploadProgressModal from "@/components/modals/UploadProgressModal";
import FilePreviewModal from "@/components/modals/FilePreviewModal";
import NewFolderModal from "@/components/modals/NewFolderModal";
import RenameFileModal from "@/components/modals/RenameFileModal";
import RenameFolderModal from "@/components/modals/RenameFolderModal";
import ShareFileModal from "@/components/modals/ShareFileModal";
import { useUpload } from "@/hooks/useUpload";
import { File, Folder } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>("/folder/:id");
  const currentFolderId = params ? parseInt(params.id) : null;
  
  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for view type (grid or list)
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  
  // State for sort type
  const [sortType, setSortType] = useState<"name" | "date" | "size" | "type">("name");
  
  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [fileToShare, setFileToShare] = useState<File | null>(null);
  
  // Get current folder
  const { data: currentFolder } = useQuery<Folder | null>({
    queryKey: ['/api/folders', currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return null;
      const response = await fetch(`/api/folders/${currentFolderId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!currentFolderId
  });
  
  // Get folders in current location
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ['/api/folders', { parentId: currentFolderId }],
    queryFn: async () => {
      const response = await fetch(`/api/folders?parentId=${currentFolderId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    }
  });
  
  // Get files in current location
  const { data: files = [] } = useQuery<File[]>({
    queryKey: ['/api/files', { folderId: currentFolderId }],
    queryFn: async () => {
      const response = await fetch(`/api/files?folderId=${currentFolderId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    }
  });
  
  // Get recent files for home view
  const { data: recentFiles = [] } = useQuery<File[]>({
    queryKey: ['/api/files/recent'],
    queryFn: async () => {
      const response = await fetch('/api/files/recent');
      if (!response.ok) throw new Error('Failed to fetch recent files');
      return response.json();
    }
  });

  // Upload functionality
  const { uploadFiles, uploads, clearCompleted } = useUpload(currentFolderId);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      setUploadModalOpen(true);
    }
  };

  // Get breadcrumb trail
  const breadcrumbs = [
    { name: "Home", path: "/" },
    ...(currentFolder && currentFolder.name ? 
      [{ 
        name: currentFolder.name, 
        path: `/folder/${currentFolder.id}` 
      }] 
    : [])
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (hidden on mobile) */}
      <Sidebar className="hidden md:block" />
      
      {/* Mobile Header (shown only on mobile) */}
      <MobileHeader 
        onMenuClick={() => setMobileMenuOpen(true)} 
      />
      
      {/* Mobile Menu (hidden by default) */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (hidden on mobile) */}
        <TopBar className="hidden md:flex" />
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:pt-6 pt-16">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm mb-6">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </span>
                )}
                <span 
                  className={`${index === breadcrumbs.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700 cursor-pointer'}`}
                  onClick={() => setLocation(crumb.path)}
                >
                  {crumb.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Action Bar */}
          <ActionBar 
            onUploadClick={() => document.getElementById('fileInput')?.click()}
            onNewFolderClick={() => setNewFolderModalOpen(true)}
            viewType={viewType}
            setViewType={setViewType}
            sortType={sortType}
            setSortType={setSortType}
          />
          
          {/* Hidden file input */}
          <input 
            type="file" 
            id="fileInput" 
            multiple 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          
          {/* Recent Files Section (only on home page) */}
          {!currentFolderId && (
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-4">Recent Files</h2>
              <FileGrid 
                files={recentFiles}
                viewType={viewType}
                sortType={sortType}
                onFileClick={(file) => setPreviewFile(file)}
                onRenameClick={setFileToRename}
                onShareClick={setFileToShare}
              />
            </section>
          )}
          
          {/* Folders Section */}
          {folders.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-medium mb-4">Folders</h2>
              <FileGrid 
                folders={folders}
                viewType={viewType}
                sortType={sortType}
                onFolderClick={(folder) => setLocation(`/folder/${folder.id}`)}
                onRenameFolderClick={setFolderToRename}
              />
            </section>
          )}
          
          {/* Files Section (if in a folder) */}
          {currentFolderId && files.length > 0 && (
            <section>
              <h2 className="text-lg font-medium mb-4">Files</h2>
              <FileGrid 
                files={files}
                viewType={viewType}
                sortType={sortType}
                onFileClick={(file) => setPreviewFile(file)}
                onRenameClick={setFileToRename}
                onShareClick={setFileToShare}
              />
            </section>
          )}
          
          {/* Empty state if no content */}
          {!currentFolderId && recentFiles.length === 0 && folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-500">No files or folders yet</h3>
              <p className="text-gray-400 mt-1 mb-4">Upload your first file or create a folder to get started</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 flex items-center shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Upload Files</span>
                </button>
                <button 
                  onClick={() => setNewFolderModalOpen(true)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                  <span>New Folder</span>
                </button>
              </div>
            </div>
          )}
          
          {currentFolderId && files.length === 0 && folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-500">This folder is empty</h3>
              <p className="text-gray-400 mt-1">Upload files or create folders to fill it up</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      <UploadProgressModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          clearCompleted();
        }}
        uploads={uploads}
      />
      
      <NewFolderModal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        parentId={currentFolderId}
      />
      
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
      
      <RenameFileModal
        file={fileToRename}
        onClose={() => setFileToRename(null)}
      />
      
      <ShareFileModal
        file={fileToShare}
        onClose={() => setFileToShare(null)}
      />
      
      <RenameFolderModal
        folder={folderToRename}
        onClose={() => setFolderToRename(null)}
      />
    </div>
  );
}
