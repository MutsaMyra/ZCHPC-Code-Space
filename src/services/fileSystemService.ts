
import { FileNode } from '../components/FileExplorer';
import { toast } from 'sonner';

export interface FileSystemOptions {
  isOnline: boolean;
}

interface SyncStatus {
  hasLocalChanges: boolean;
  lastSyncTime: Date | null;
  conflictFiles: string[];
}

class FileSystemService {
  private static instance: FileSystemService;
  private isOnline: boolean = navigator.onLine;
  private localFiles: FileNode[] = [];
  private cloudFiles: FileNode[] = [];
  private syncStatus: SyncStatus = {
    hasLocalChanges: false,
    lastSyncTime: null,
    conflictFiles: []
  };
  private syncQueue: Array<{ action: string; file: FileNode; timestamp: Date }> = [];
  
  private constructor() {
    this.loadLocalData();
    this.initializeListeners();
  }
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private initializeListeners() {
    // Listen for online/offline events to update mode
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast.info('Connected to network. Cloud storage available.');
      this.attemptCloudSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('Network disconnected. Using local storage only.');
    });

    // Auto-sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && this.syncStatus.hasLocalChanges) {
        this.attemptCloudSync();
      }
    }, 5 * 60 * 1000);
  }

  private loadLocalData() {
    try {
      // Load local files
      const localData = localStorage.getItem('filesystem_local');
      if (localData) {
        this.localFiles = JSON.parse(localData);
      } else {
        this.localFiles = this.generateSampleFiles('Local');
      }

      // Load cloud files
      const cloudData = localStorage.getItem('filesystem_cloud');
      if (cloudData) {
        this.cloudFiles = JSON.parse(cloudData);
      } else {
        this.cloudFiles = this.generateSampleFiles('Cloud');
      }

      // Load sync status
      const syncData = localStorage.getItem('filesystem_sync');
      if (syncData) {
        const parsed = JSON.parse(syncData);
        this.syncStatus = {
          ...parsed,
          lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null
        };
      }

      // Load sync queue
      const queueData = localStorage.getItem('filesystem_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load local data:', error);
      this.localFiles = this.generateSampleFiles('Local');
      this.cloudFiles = this.generateSampleFiles('Cloud');
    }
  }

  private saveLocalData() {
    try {
      localStorage.setItem('filesystem_local', JSON.stringify(this.localFiles));
      localStorage.setItem('filesystem_cloud', JSON.stringify(this.cloudFiles));
      localStorage.setItem('filesystem_sync', JSON.stringify({
        ...this.syncStatus,
        lastSyncTime: this.syncStatus.lastSyncTime?.toISOString()
      }));
      localStorage.setItem('filesystem_queue', JSON.stringify(this.syncQueue.map(item => ({
        ...item,
        timestamp: item.timestamp.toISOString()
      }))));
    } catch (error) {
      console.error('Failed to save local data:', error);
    }
  }
  
  public getFiles(): FileNode[] {
    return this.isOnline ? this.cloudFiles : this.localFiles;
  }
  
  public getCurrentMode(): 'online' | 'offline' {
    return this.isOnline ? 'online' : 'offline';
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public getQueuedChanges(): number {
    return this.syncQueue.length;
  }
  
  public saveFile(file: FileNode): void {
    const files = this.isOnline ? this.cloudFiles : this.localFiles;
    
    const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === file.id) {
          return { ...node, content: file.content, lastModified: new Date() };
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
      this.syncStatus.lastSyncTime = new Date();
      toast.success('File saved to cloud storage');
    } else {
      this.localFiles = updateFileInTree(files);
      this.queueChange('update', file);
      this.syncStatus.hasLocalChanges = true;
      toast.success('File saved locally (will sync when online)');
    }
    
    this.saveLocalData();
  }

  public createFile(parentId: string, fileName: string, content: string = ''): FileNode | null {
    const newFile: FileNode = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      type: 'file',
      extension: fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '',
      content,
      lastModified: new Date()
    };

    const files = this.isOnline ? this.cloudFiles : this.localFiles;
    
    const addFileToTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newFile]
          };
        } else if (node.children) {
          return {
            ...node,
            children: addFileToTree(node.children)
          };
        }
        return node;
      });
    };

    if (this.isOnline) {
      this.cloudFiles = addFileToTree(files);
      toast.success('File created in cloud storage');
    } else {
      this.localFiles = addFileToTree(files);
      this.queueChange('create', newFile);
      this.syncStatus.hasLocalChanges = true;
      toast.success('File created locally (will sync when online)');
    }

    this.saveLocalData();
    return newFile;
  }

  public deleteFile(fileId: string): boolean {
    const files = this.isOnline ? this.cloudFiles : this.localFiles;
    let deletedFile: FileNode | null = null;
    
    const removeFileFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => {
        if (node.id === fileId) {
          deletedFile = node;
          return false;
        }
        if (node.children) {
          node.children = removeFileFromTree(node.children);
        }
        return true;
      });
    };

    if (this.isOnline) {
      this.cloudFiles = removeFileFromTree(files);
      toast.success('File deleted from cloud storage');
    } else {
      this.localFiles = removeFileFromTree(files);
      if (deletedFile) {
        this.queueChange('delete', deletedFile);
      }
      this.syncStatus.hasLocalChanges = true;
      toast.success('File deleted locally (will sync when online)');
    }

    this.saveLocalData();
    return deletedFile !== null;
  }

  private queueChange(action: string, file: FileNode) {
    this.syncQueue.push({
      action,
      file: { ...file },
      timestamp: new Date()
    });
  }

  public async attemptCloudSync(): Promise<boolean> {
    if (!this.isOnline) {
      toast.warning('Cannot sync: device is offline');
      return false;
    }

    if (this.syncQueue.length === 0 && !this.syncStatus.hasLocalChanges) {
      return true;
    }

    try {
      toast.info('Syncing changes to cloud...');
      
      // Simulate cloud sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process sync queue
      for (const change of this.syncQueue) {
        console.log(`Syncing ${change.action} for file: ${change.file.name}`);
        // In a real implementation, this would make API calls to sync changes
      }

      // Merge local changes to cloud
      this.cloudFiles = [...this.localFiles];
      
      // Clear sync queue and update status
      this.syncQueue = [];
      this.syncStatus.hasLocalChanges = false;
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.conflictFiles = [];

      this.saveLocalData();
      
      toast.success(`Successfully synced ${this.syncQueue.length} changes to cloud`);
      return true;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      toast.error('Failed to sync with cloud. Changes saved locally.');
      return false;
    }
  }

  public async forceSync(): Promise<boolean> {
    return await this.attemptCloudSync();
  }

  public resolveConflict(fileId: string, useLocal: boolean): void {
    // In a real implementation, this would resolve merge conflicts
    this.syncStatus.conflictFiles = this.syncStatus.conflictFiles.filter(id => id !== fileId);
    this.saveLocalData();
    
    toast.success(`Conflict resolved for file using ${useLocal ? 'local' : 'cloud'} version`);
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
            content: `// ${storageType} storage example file\nconsole.log("Hello from ${storageType} storage!");`,
            lastModified: new Date()
          },
          {
            id: `example-py-${storageType.toLowerCase()}`,
            name: 'example.py',
            type: 'file',
            extension: '.py',
            content: `# ${storageType} storage example file\nprint("Hello from ${storageType} storage!")`,
            lastModified: new Date()
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
                content: `console.log("${storageType} project main file");`,
                lastModified: new Date()
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
                content: `# ${storageType} Project\n\nThis file is stored in ${storageType.toLowerCase()} storage.`,
                lastModified: new Date()
              },
            ],
          },
        ],
      },
    ];
  }
}

export const fileSystemService = FileSystemService.getInstance();
