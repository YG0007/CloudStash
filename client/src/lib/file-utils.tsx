import React from 'react';
import { 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileSpreadsheet, 
  FileCode, 
  FileArchive,
  File as FileIcon
} from "lucide-react";

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string, size = 48): React.ReactNode {
  const props = { 
    className: getFileIconColor(mimeType), 
    size 
  };
  
  // Images
  if (mimeType.startsWith('image/')) {
    return <FileImage {...props} />;
  }
  
  // Videos
  if (mimeType.startsWith('video/')) {
    return <FileVideo {...props} />;
  }
  
  // Audio
  if (mimeType.startsWith('audio/')) {
    return <FileAudio {...props} />;
  }
  
  // PDFs
  if (mimeType === 'application/pdf') {
    return <FileText className="text-red-500" size={size} />;
  }
  
  // Spreadsheets
  if (mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'text/csv') {
    return <FileSpreadsheet className="text-green-600" size={size} />;
  }
  
  // Word documents
  if (mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <FileText className="text-blue-600" size={size} />;
  }
  
  // PowerPoint
  if (mimeType === 'application/vnd.ms-powerpoint' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return <FileText className="text-orange-500" size={size} />;
  }
  
  // Code/text files
  if (mimeType === 'text/plain' || 
      mimeType === 'text/html' || 
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType.includes('javascript')) {
    return <FileCode className="text-purple-500" size={size} />;
  }
  
  // Archives
  if (mimeType === 'application/zip' || 
      mimeType === 'application/x-rar-compressed' ||
      mimeType === 'application/x-7z-compressed' ||
      mimeType === 'application/x-tar') {
    return <FileArchive className="text-amber-500" size={size} />;
  }
  
  // Default
  return <FileIcon className="text-gray-500" size={size} />;
}

function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'text-purple-500';
  }
  
  if (mimeType.startsWith('video/')) {
    return 'text-blue-400';
  }
  
  if (mimeType.startsWith('audio/')) {
    return 'text-cyan-500';
  }
  
  if (mimeType === 'application/pdf') {
    return 'text-red-500';
  }
  
  if (mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'text/csv') {
    return 'text-green-600';
  }
  
  if (mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'text-blue-600';
  }
  
  return 'text-gray-500';
}