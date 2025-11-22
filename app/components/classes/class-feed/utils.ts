import { File, FileDoc, FileJpg, FilePdf, FilePng, FilePpt, FileXls, FileZip } from "phosphor-react-native";

// get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// get file icon and color based on file type
export const getFileIcon = (filename: string) => {
  const ext = getFileExtension(filename);
  
  switch (ext) {
    case 'pdf':
      return { Icon: FilePdf, color: '#DC2626' }; // red
    case 'png':
      return { Icon: FilePng, color: '#059669' }; // green
    case 'jpg':
    case 'jpeg':
      return { Icon: FileJpg, color: '#2563EB' }; // blue
    case 'ppt':
    case 'pptx':
      return { Icon: FilePpt, color: '#EA580C' }; // orange
    case 'doc':
    case 'docx':
      return { Icon: FileDoc, color: '#2563EB' }; // blue
    case 'xls':
    case 'xlsx':
      return { Icon: FileXls, color: '#16A34A' }; // green
    case 'zip':
    case 'rar':
    case '7z':
      return { Icon: FileZip, color: '#7C3AED' }; // purple
    default:
      return { Icon: File, color: '#6B7280' }; // gray
  }
};

