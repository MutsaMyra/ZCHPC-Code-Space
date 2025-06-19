
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
    this.fileSystemSupported = 'showDirectoryPicker' in window;
    
    if (!this.fileSystemSupported) {
      console.warn('File System Access API not supported in this browser');
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
      toast.error('File system access not supported in this browser');
      return false;
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      toast.success(`Selected save location: ${this.directoryHandle.name}`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to select directory:', error);
        toast.error('Failed to select save location');
      }
      return false;
    }
  }

  public async saveFile(fileName: string, content: string): Promise<boolean> {
    if (!this.directoryHandle) {
      const locationSelected = await this.promptForSaveLocation();
      if (!locationSelected) return false;
    }

    try {
      const fileHandle = await this.directoryHandle!.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      toast.error(`Failed to save ${fileName}`);
      return false;
    }
  }

  public async saveProject(files: FileNode[], projectName: string): Promise<boolean> {
    if (!this.directoryHandle) {
      const locationSelected = await this.promptForSaveLocation();
      if (!locationSelected) return false;
    }

    try {
      // Create project directory
      const projectHandle = await this.directoryHandle!.getDirectoryHandle(projectName, { create: true });
      
      // Save all files preserving structure
      await this.saveFilesRecursively(files, projectHandle);
      
      toast.success(`Project saved to local filesystem: ${projectName}`);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project to local filesystem');
      return false;
    }
  }

  private async saveFilesRecursively(files: FileNode[], directoryHandle: FileSystemDirectoryHandle): Promise<void> {
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

  public async exportAsZip(files: FileNode[], projectName: string): Promise<void> {
    // Fallback for browsers that don't support File System Access API
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
    } catch (error) {
      console.error('Failed to export as ZIP:', error);
      toast.error('Failed to export project');
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
    return this.directoryHandle?.name || null;
  }
}

export const localFileSystemService = LocalFileSystemService.getInstance();
