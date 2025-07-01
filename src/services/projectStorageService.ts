
import { FileNode } from '../components/FileExplorer';
import { ProjectMetadata, Project } from './projectManager';
import { toast } from 'sonner';

interface StorageLocation {
  handle: FileSystemDirectoryHandle;
  path: string;
}

class ProjectStorageService {
  private static instance: ProjectStorageService;
  private projectLocations: Map<string, StorageLocation> = new Map();
  private isSupported: boolean;

  private constructor() {
    this.isSupported = 'showDirectoryPicker' in window && 
                       window.isSecureContext && 
                       window.self === window.top;
  }

  public static getInstance(): ProjectStorageService {
    if (!ProjectStorageService.instance) {
      ProjectStorageService.instance = new ProjectStorageService();
    }
    return ProjectStorageService.instance;
  }

  public async selectProjectLocation(projectId: string, projectName: string): Promise<boolean> {
    if (!this.isSupported) {
      toast.info('File system access not available. Using browser storage.');
      return true;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Create project folder
      const projectHandle = await directoryHandle.getDirectoryHandle(projectName, { create: true });
      
      this.projectLocations.set(projectId, {
        handle: projectHandle,
        path: `${directoryHandle.name}/${projectName}`
      });

      toast.success(`Project location selected: ${directoryHandle.name}/${projectName}`);
      this.saveLocationToStorage(projectId, projectName);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      console.error('Failed to select project location:', error);
      toast.error('Failed to select project location');
      return false;
    }
  }

  public hasProjectLocation(projectId: string): boolean {
    return this.projectLocations.has(projectId) || !this.isSupported;
  }

  public async saveProject(project: Project): Promise<boolean> {
    const projectId = project.metadata.id;
    
    if (!this.hasProjectLocation(projectId)) {
      const success = await this.selectProjectLocation(projectId, project.metadata.name);
      if (!success) return false;
    }

    try {
      if (this.isSupported && this.projectLocations.has(projectId)) {
        return await this.saveToFileSystem(project);
      } else {
        return await this.saveToBrowserStorage(project);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error(`Failed to save project: ${project.metadata.name}`);
      return false;
    }
  }

  public async saveFile(projectId: string, file: FileNode): Promise<boolean> {
    if (!this.hasProjectLocation(projectId)) {
      return false;
    }

    try {
      if (this.isSupported && this.projectLocations.has(projectId)) {
        return await this.saveFileToFileSystem(projectId, file);
      } else {
        return await this.saveFileToBrowserStorage(projectId, file);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      toast.error(`Failed to save file: ${file.name}`);
      return false;
    }
  }

  private async saveToFileSystem(project: Project): Promise<boolean> {
    const location = this.projectLocations.get(project.metadata.id);
    if (!location) return false;

    try {
      // Save project metadata
      const metadataHandle = await location.handle.getFileHandle('project.json', { create: true });
      const metadataWritable = await metadataHandle.createWritable();
      await metadataWritable.write(JSON.stringify(project.metadata, null, 2));
      await metadataWritable.close();

      // Save all files
      await this.saveFilesRecursively(project.files, location.handle);
      
      toast.success(`Project saved to ${location.path}`);
      return true;
    } catch (error) {
      console.error('Failed to save to file system:', error);
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

  private async saveFileToFileSystem(projectId: string, file: FileNode): Promise<boolean> {
    const location = this.projectLocations.get(projectId);
    if (!location || !file.content) return false;

    try {
      const fileHandle = await location.handle.getFileHandle(file.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file.content);
      await writable.close();
      return true;
    } catch (error) {
      console.error('Failed to save file to file system:', error);
      return false;
    }
  }

  private async saveToBrowserStorage(project: Project): Promise<boolean> {
    try {
      const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
      const existingIndex = projectsData.findIndex((p: any) => p.id === project.metadata.id);
      
      const projectData = {
        ...project,
        metadata: {
          ...project.metadata,
          lastModified: new Date().toISOString()
        }
      };

      if (existingIndex >= 0) {
        projectsData[existingIndex] = projectData;
      } else {
        projectsData.push(projectData);
      }

      localStorage.setItem('projects', JSON.stringify(projectsData));
      toast.success('Project saved to browser storage');
      return true;
    } catch (error) {
      console.error('Failed to save to browser storage:', error);
      return false;
    }
  }

  private async saveFileToBrowserStorage(projectId: string, file: FileNode): Promise<boolean> {
    try {
      const projectsData = JSON.parse(localStorage.getItem('projects') || '[]');
      const projectIndex = projectsData.findIndex((p: any) => p.metadata.id === projectId);
      
      if (projectIndex >= 0) {
        const updateFileInTree = (files: FileNode[]): FileNode[] => {
          return files.map(f => {
            if (f.id === file.id) {
              return { ...file, lastModified: new Date() };
            } else if (f.children) {
              return { ...f, children: updateFileInTree(f.children) };
            }
            return f;
          });
        };

        projectsData[projectIndex].files = updateFileInTree(projectsData[projectIndex].files);
        projectsData[projectIndex].metadata.lastModified = new Date().toISOString();
        
        localStorage.setItem('projects', JSON.stringify(projectsData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save file to browser storage:', error);
      return false;
    }
  }

  private saveLocationToStorage(projectId: string, projectName: string): void {
    try {
      const locations = JSON.parse(localStorage.getItem('projectLocations') || '{}');
      locations[projectId] = {
        path: projectName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('projectLocations', JSON.stringify(locations));
    } catch (error) {
      console.error('Failed to save location to storage:', error);
    }
  }

  public getProjectLocation(projectId: string): string | null {
    const location = this.projectLocations.get(projectId);
    return location?.path || null;
  }
}

export const projectStorageService = ProjectStorageService.getInstance();
