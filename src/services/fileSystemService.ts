
import { FileNode } from '../components/FileExplorer';
import { toast } from 'sonner';

export interface FileSystemOptions {
  isOnline: boolean;
}

class FileSystemService {
  private static instance: FileSystemService;
  private isOnline: boolean = navigator.onLine;
  private localFiles: FileNode[] = [];
  private cloudFiles: FileNode[] = [];
  
  private constructor() {
    // Initialize with some default files
    this.localFiles = this.generateSampleFiles('Local');
    this.cloudFiles = this.generateSampleFiles('Cloud');
    
    // Listen for online/offline events to update mode
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast.info('Connected to network. Cloud storage available.');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('Network disconnected. Using local storage only.');
    });
  }
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }
  
  public getFiles(): FileNode[] {
    return this.isOnline ? this.cloudFiles : this.localFiles;
  }
  
  public getCurrentMode(): 'online' | 'offline' {
    return this.isOnline ? 'online' : 'offline';
  }
  
  public saveFile(file: FileNode): void {
    const files = this.isOnline ? this.cloudFiles : this.localFiles;
    
    const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === file.id) {
          return { ...node, content: file.content };
        } else if (node.children) {
          return {
            ...node,
            children: updateFileInTree(node.children),
          };
        }
        return node;
      });
    };
    
    if (this.isOnline) {
      this.cloudFiles = updateFileInTree(files);
      toast.success('File saved to cloud storage');
    } else {
      this.localFiles = updateFileInTree(files);
      toast.success('File saved to local storage');
    }
  }
  
  public syncFiles(): void {
    if (this.isOnline) {
      // In a real app, this would merge local changes to cloud
      toast.success('Files synchronized with cloud storage');
    } else {
      toast.error('Cannot sync files while offline');
    }
  }
  
  private generateSampleFiles(storageType: string): FileNode[] {
    return [
      {
        id: `examples-${storageType.toLowerCase()}`,
        name: 'Examples',
        type: 'folder',
        children: [
          {
            id: `example-js-${storageType.toLowerCase()}`,
            name: 'example.js',
            type: 'file',
            extension: '.js',
            content: `// ${storageType} storage example file\nconsole.log("Hello from ${storageType} storage!");`
          },
          {
            id: `example-py-${storageType.toLowerCase()}`,
            name: 'example.py',
            type: 'file',
            extension: '.py',
            content: `# ${storageType} storage example file\nprint("Hello from ${storageType} storage!")`
          }
        ],
      },
      {
        id: `project-${storageType.toLowerCase()}`,
        name: `${storageType} Projects`,
        type: 'folder',
        children: [
          {
            id: `src-${storageType.toLowerCase()}`,
            name: 'src',
            type: 'folder',
            children: [
              {
                id: `main-${storageType.toLowerCase()}`,
                name: 'main.js',
                type: 'file',
                extension: '.js',
                content: `console.log("${storageType} project main file");`
              },
            ],
          },
          {
            id: `docs-${storageType.toLowerCase()}`,
            name: 'docs',
            type: 'folder',
            children: [
              {
                id: `readme-${storageType.toLowerCase()}`,
                name: 'README.md',
                type: 'file',
                extension: '.md',
                content: `# ${storageType} Project\n\nThis file is stored in ${storageType.toLowerCase()} storage.`
              },
            ],
          },
        ],
      },
    ];
  }
}

export const fileSystemService = FileSystemService.getInstance();
