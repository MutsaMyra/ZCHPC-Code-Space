import { FileNode } from '../components/FileExplorer';
import { toast } from 'sonner';

export interface SaveOptions {
  promptForLocation: boolean;
  preserveStructure: boolean;
  includeProjectFiles: boolean;
}

class LocalFileSystemService {
  private static instance: LocalFileSystemService;
  private fileSystemSupported: boolean;
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  private constructor() {
    // Check if we're in a secure context and not in an iframe
    this.fileSystemSupported = 'showDirectoryPicker' in window && 
                                window.isSecureContext && 
                                window.self === window.top;
    
    if (!this.fileSystemSupported) {
      console.info('File System Access API not supported - using download fallback');
    }
  }

  public static getInstance(): LocalFileSystemService {
    if (!LocalFileSystemService.instance) {
      LocalFileSystemService.instance = new LocalFileSystemService();
    }
    return LocalFileSystemService.instance;
  }

  public isSupported(): boolean {
    return this.fileSystemSupported;
  }

  public async promptForSaveLocation(): Promise<boolean> {
    if (!this.fileSystemSupported) {
      toast.info('Direct file system access not available. Files will be downloaded automatically.');
      return true; // Return true to proceed with download fallback
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      toast.success(`Save location selected: ${this.directoryHandle.name}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return false; // User cancelled
        } else if (error.name === 'SecurityError') {
          toast.info('Direct file system access not available. Files will be downloaded automatically.');
          return true; // Proceed with download fallback
        }
      }
      console.error('Failed to select directory:', error);
      toast.error('Failed to select save location - using download fallback');
      return true; // Proceed with download fallback
    }
  }

  public async saveFile(fileName: string, content: string): Promise<boolean> {
    // If we have directory handle, try to use it
    if (this.directoryHandle) {
      try {
        const fileHandle = await this.directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        toast.success(`File saved: ${fileName}`);
        return true;
      } catch (error) {
        console.error('Failed to save file to directory:', error);
        // Fall back to download
      }
    }

    // Fallback: download the file
    return this.downloadFile(fileName, content);
  }

  public async saveProject(files: FileNode[], projectName: string): Promise<boolean> {
    // If we have directory handle, try to use it
    if (this.directoryHandle) {
      try {
        const projectHandle = await this.directoryHandle.getDirectoryHandle(projectName, { create: true });
        await this.saveFilesRecursively(files, projectHandle);
        toast.success(`Project saved to local filesystem: ${projectName}`);
        return true;
      } catch (error) {
        console.error('Failed to save project to directory:', error);
        // Fall back to ZIP download
      }
    }

    // Fallback: export as ZIP
    return this.exportAsZip(files, projectName);
  }

  private downloadFile(fileName: string, content: string): boolean {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`File downloaded: ${fileName}`);
      return true;
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(`Failed to download ${fileName}`);
      return false;
    }
  }

  public async saveFilesRecursively(files: FileNode[], directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    for (const file of files) {
      if (file.type === 'file' && file.content !== undefined) {
        try {
          const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file.content);
          await writable.close();
        } catch (error) {
          console.error(`Failed to save file ${file.name}:`, error);
        }
      } else if (file.type === 'folder' && file.children) {
        try {
          const subDirectoryHandle = await directoryHandle.getDirectoryHandle(file.name, { create: true });
          await this.saveFilesRecursively(file.children, subDirectoryHandle);
        } catch (error) {
          console.error(`Failed to create directory ${file.name}:`, error);
        }
      }
    }
  }

  public async exportSingleFileAsZip(fileName: string, content: string): Promise<boolean> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      zip.file(fileName, content);
      
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipContent);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('File exported as ZIP');
      return true;
    } catch (error) {
      console.error('Failed to export file as ZIP:', error);
      toast.error('Failed to export file');
      return false;
    }
  }

  public async exportAsZip(files: FileNode[], projectName: string): Promise<boolean> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      this.addFilesToZip(files, zip);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Project exported as ZIP file');
      return true;
    } catch (error) {
      console.error('Failed to export as ZIP:', error);
      toast.error('Failed to export project');
      return false;
    }
  }

  private addFilesToZip(files: FileNode[], zip: any, basePath: string = ''): void {
    for (const file of files) {
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
      
      if (file.type === 'file' && file.content !== undefined) {
        zip.file(fullPath, file.content);
      } else if (file.type === 'folder' && file.children) {
        this.addFilesToZip(file.children, zip, fullPath);
      }
    }
  }

  public getCurrentSaveLocation(): string | null {
    return this.directoryHandle?.name || 'Downloads';
  }

  public hasSaveLocation(): boolean {
    return true; // Always return true since we have download fallback
  }
}

export const localFileSystemService = LocalFileSystemService.getInstance();
