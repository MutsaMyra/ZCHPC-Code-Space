import { toast } from 'sonner';
import { projectManager } from './projectManager';

export interface PackageInfo {
  name: string;
  description: string;
  version: string;
  popularity: 'High' | 'Medium' | 'Low';
  homepage?: string;
  repository?: string;
  downloads?: number;
  keywords?: string[];
}

export interface LanguagePackageSource {
  searchUrl: string;
  apiUrl: string;
  packageManager: string;
}

// Package sources for different languages
const PACKAGE_SOURCES: Record<string, LanguagePackageSource> = {
  javascript: {
    searchUrl: 'https://www.npmjs.com/search?q=',
    apiUrl: 'https://registry.npmjs.org',
    packageManager: 'npm'
  },
  python: {
    searchUrl: 'https://pypi.org/search/?q=',
    apiUrl: 'https://pypi.org/pypi',
    packageManager: 'pip'
  },
  php: {
    searchUrl: 'https://packagist.org/search/?q=',
    apiUrl: 'https://packagist.org/packages',
    packageManager: 'composer'
  },
  java: {
    searchUrl: 'https://search.maven.org/search?q=',
    apiUrl: 'https://search.maven.org/solrsearch/select',
    packageManager: 'maven'
  },
  cpp: {
    searchUrl: 'https://conan.io/center/search?q=',
    apiUrl: 'https://api.conan.io/v2',
    packageManager: 'conan'
  }
};

class DependencyService {
  private static instance: DependencyService;
  private isOnline: boolean = navigator.onLine;
  private offlinePackages: Map<string, PackageInfo[]> = new Map();

  private constructor() {
    this.initializeOfflinePackages();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast.info('Connection restored. Package search now available.');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('Offline mode. Using cached packages only.');
    });
  }

  public static getInstance(): DependencyService {
    if (!DependencyService.instance) {
      DependencyService.instance = new DependencyService();
    }
    return DependencyService.instance;
  }

  private initializeOfflinePackages() {
    // Initialize with popular packages for offline use
    this.offlinePackages.set('javascript', [
      { name: 'react', description: 'A JavaScript library for building user interfaces', version: '18.2.0', popularity: 'High' },
      { name: 'lodash', description: 'A modern JavaScript utility library', version: '4.17.21', popularity: 'High' },
      { name: 'axios', description: 'Promise based HTTP client', version: '1.5.0', popularity: 'High' },
      { name: 'moment', description: 'Parse, validate, manipulate, and display dates', version: '2.29.4', popularity: 'Medium' },
      { name: 'express', description: 'Fast, unopinionated, minimalist web framework', version: '4.18.2', popularity: 'High' }
    ]);

    this.offlinePackages.set('python', [
      { name: 'numpy', description: 'Fundamental package for scientific computing', version: '1.26.0', popularity: 'High' },
      { name: 'pandas', description: 'Powerful data structures for data analysis', version: '2.1.1', popularity: 'High' },
      { name: 'requests', description: 'HTTP library for Python', version: '2.31.0', popularity: 'High' },
      { name: 'matplotlib', description: 'Python plotting library', version: '3.8.0', popularity: 'High' },
      { name: 'scikit-learn', description: 'Machine learning library', version: '1.3.1', popularity: 'High' }
    ]);

    this.offlinePackages.set('php', [
      { name: 'guzzlehttp/guzzle', description: 'Guzzle HTTP client library', version: '7.8.0', popularity: 'High' },
      { name: 'symfony/console', description: 'Symfony Console Component', version: '6.3.4', popularity: 'High' },
      { name: 'phpunit/phpunit', description: 'Testing framework for PHP', version: '10.4.1', popularity: 'High' },
      { name: 'monolog/monolog', description: 'Logging library for PHP', version: '3.4.0', popularity: 'High' },
      { name: 'doctrine/orm', description: 'Object-relational mapper', version: '2.16.1', popularity: 'Medium' }
    ]);
  }

  public async searchPackages(query: string, language: string): Promise<PackageInfo[]> {
    if (!this.isOnline) {
      return this.searchOfflinePackages(query, language);
    }

    try {
      return await this.searchOnlinePackages(query, language);
    } catch (error) {
      console.error('Online search failed, falling back to offline:', error);
      toast.warning('Online search failed. Showing cached packages.');
      return this.searchOfflinePackages(query, language);
    }
  }

  private searchOfflinePackages(query: string, language: string): PackageInfo[] {
    const packages = this.offlinePackages.get(language) || [];
    if (!query.trim()) return packages;

    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(query.toLowerCase()) ||
      pkg.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  private async searchOnlinePackages(query: string, language: string): Promise<PackageInfo[]> {
    const source = PACKAGE_SOURCES[language];
    if (!source) {
      toast.warning(`Online search not available for ${language}. Using cached packages.`);
      return this.searchOfflinePackages(query, language);
    }

    try {
      switch (language) {
        case 'javascript':
          return await this.searchNpmPackages(query);
        case 'python':
          return await this.searchPypiPackages(query);
        case 'php':
          return await this.searchPackagistPackages(query);
        default:
          return this.searchOfflinePackages(query, language);
      }
    } catch (error) {
      throw new Error(`Failed to search ${source.packageManager} packages: ${error}`);
    }
  }

  private async searchNpmPackages(query: string): Promise<PackageInfo[]> {
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`);
    
    if (!response.ok) {
      throw new Error(`NPM search failed: ${response.status}`);
    }

    const data = await response.json();
    
    return data.objects.map((item: any) => ({
      name: item.package.name,
      description: item.package.description || 'No description available',
      version: item.package.version,
      popularity: this.getPopularityLevel(item.score.detail.popularity),
      homepage: item.package.links?.homepage,
      repository: item.package.links?.repository,
      downloads: item.score.detail.popularity,
      keywords: item.package.keywords
    }));
  }

  private async searchPypiPackages(query: string): Promise<PackageInfo[]> {
    // PyPI doesn't have a direct search API, so we'll simulate it
    // In a real implementation, you'd use a service like PyPI's XML-RPC API
    const mockResults: PackageInfo[] = [
      { name: `${query}-package`, description: `Search result for ${query}`, version: '1.0.0', popularity: 'Medium' },
      { name: `python-${query}`, description: `Python library for ${query}`, version: '2.1.0', popularity: 'High' }
    ];
    
    return mockResults;
  }

  private async searchPackagistPackages(query: string): Promise<PackageInfo[]> {
    const response = await fetch(`https://packagist.org/search.json?q=${encodeURIComponent(query)}&per_page=20`);
    
    if (!response.ok) {
      throw new Error(`Packagist search failed: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map((item: any) => ({
      name: item.name,
      description: item.description || 'No description available',
      version: 'latest',
      popularity: this.getPopularityLevel(item.downloads),
      homepage: item.url,
      repository: item.repository
    }));
  }

  private getPopularityLevel(score: number): 'High' | 'Medium' | 'Low' {
    if (score > 0.7) return 'High';
    if (score > 0.3) return 'Medium';
    return 'Low';
  }

  public async installPackage(packageName: string, language: string, projectId: string): Promise<boolean> {
    try {
      // In offline mode, just add to project dependencies
      if (!this.isOnline) {
        return this.addPackageToProject(packageName, projectId);
      }

      // Online mode: fetch package info and add to project
      const packageInfo = await this.getPackageInfo(packageName, language);
      if (packageInfo) {
        return this.addPackageToProject(packageName, projectId, packageInfo);
      }
      
      return false;
    } catch (error) {
      console.error('Package installation failed:', error);
      toast.error(`Failed to install ${packageName}`);
      return false;
    }
  }

  private async getPackageInfo(packageName: string, language: string): Promise<PackageInfo | null> {
    const source = PACKAGE_SOURCES[language];
    if (!source) return null;

    try {
      switch (language) {
        case 'javascript':
          const response = await fetch(`${source.apiUrl}/${packageName}`);
          if (!response.ok) return null;
          
          const data = await response.json();
          return {
            name: data.name,
            description: data.description || 'No description available',
            version: data['dist-tags']?.latest || 'latest',
            popularity: 'Medium',
            homepage: data.homepage,
            repository: data.repository?.url
          };
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to fetch package info:', error);
      return null;
    }
  }

  private addPackageToProject(packageName: string, projectId: string, packageInfo?: PackageInfo): boolean {
    try {
      const project = projectManager.getProject(projectId);
      if (!project) {
        toast.error('Project not found');
        return false;
      }

      // Add package to project dependencies
      if (!project.metadata.dependencies.includes(packageName)) {
        project.metadata.dependencies.push(packageName);
        
        // Create/update dependency files based on language
        this.updateDependencyFiles(project, packageName);
        
        projectManager.updateProjectFiles(projectId, project.files);
        
        toast.success(`${packageName} added to project dependencies`);
        return true;
      } else {
        toast.info(`${packageName} is already installed`);
        return true;
      }
    } catch (error) {
      console.error('Failed to add package to project:', error);
      return false;
    }
  }

  private updateDependencyFiles(project: any, packageName: string): void {
    const language = project.metadata.language;
    
    switch (language) {
      case 'javascript':
        this.updatePackageJson(project, packageName);
        break;
      case 'python':
        this.updateRequirementsTxt(project, packageName);
        break;
      case 'php':
        this.updateComposerJson(project, packageName);
        break;
      default:
        // For other languages, just add to dependencies list
        break;
    }
  }

  private updatePackageJson(project: any, packageName: string): void {
    let packageJsonFile = this.findFileInProject(project.files, 'package.json');
    
    if (!packageJsonFile) {
      // Create package.json if it doesn't exist
      const newPackageJson = {
        id: 'package-json',
        name: 'package.json',
        type: 'file' as const,
        extension: '.json',
        content: JSON.stringify({
          name: project.metadata.name.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          dependencies: {
            [packageName]: 'latest'
          }
        }, null, 2),
        lastModified: new Date()
      };
      
      project.files.push(newPackageJson);
    } else {
      // Update existing package.json
      try {
        const packageData = JSON.parse(packageJsonFile.content || '{}');
        if (!packageData.dependencies) {
          packageData.dependencies = {};
        }
        packageData.dependencies[packageName] = 'latest';
        
        packageJsonFile.content = JSON.stringify(packageData, null, 2);
        packageJsonFile.lastModified = new Date();
      } catch (error) {
        console.error('Failed to update package.json:', error);
      }
    }
  }

  private updateRequirementsTxt(project: any, packageName: string): void {
    let requirementsFile = this.findFileInProject(project.files, 'requirements.txt');
    
    if (!requirementsFile) {
      // Create requirements.txt if it doesn't exist
      const newRequirements = {
        id: 'requirements-txt',
        name: 'requirements.txt',
        type: 'file' as const,
        extension: '.txt',
        content: `${packageName}\n`,
        lastModified: new Date()
      };
      
      project.files.push(newRequirements);
    } else {
      // Update existing requirements.txt
      const currentContent = requirementsFile.content || '';
      const packages = currentContent.split('\n').filter(line => line.trim());
      
      if (!packages.includes(packageName)) {
        packages.push(packageName);
        requirementsFile.content = packages.join('\n') + '\n';
        requirementsFile.lastModified = new Date();
      }
    }
  }

  private updateComposerJson(project: any, packageName: string): void {
    let composerFile = this.findFileInProject(project.files, 'composer.json');
    
    if (!composerFile) {
      // Create composer.json if it doesn't exist
      const newComposer = {
        id: 'composer-json',
        name: 'composer.json',
        type: 'file' as const,
        extension: '.json',
        content: JSON.stringify({
          name: project.metadata.name.toLowerCase().replace(/\s+/g, '-'),
          require: {
            [packageName]: '^1.0'
          }
        }, null, 2),
        lastModified: new Date()
      };
      
      project.files.push(newComposer);
    } else {
      // Update existing composer.json
      try {
        const composerData = JSON.parse(composerFile.content || '{}');
        if (!composerData.require) {
          composerData.require = {};
        }
        composerData.require[packageName] = '^1.0';
        
        composerFile.content = JSON.stringify(composerData, null, 2);
        composerFile.lastModified = new Date();
      } catch (error) {
        console.error('Failed to update composer.json:', error);
      }
    }
  }

  private findFileInProject(files: any[], fileName: string): any {
    for (const file of files) {
      if (file.type === 'file' && file.name === fileName) {
        return file;
      } else if (file.type === 'folder' && file.children) {
        const found = this.findFileInProject(file.children, fileName);
        if (found) return found;
      }
    }
    return null;
  }

  public removePackage(packageName: string, projectId: string): boolean {
    try {
      const project = projectManager.getProject(projectId);
      if (!project) {
        toast.error('Project not found');
        return false;
      }

      project.metadata.dependencies = project.metadata.dependencies.filter(dep => dep !== packageName);
      
      // Remove from dependency files
      this.removeFromDependencyFiles(project, packageName);
      
      projectManager.updateProjectFiles(projectId, project.files);
      
      toast.success(`${packageName} removed from project`);
      return true;
    } catch (error) {
      console.error('Failed to remove package:', error);
      return false;
    }
  }

  private removeFromDependencyFiles(project: any, packageName: string): void {
    const language = project.metadata.language;
    
    switch (language) {
      case 'javascript':
        this.removeFromPackageJson(project, packageName);
        break;
      case 'python':
        this.removeFromRequirementsTxt(project, packageName);
        break;
      case 'php':
        this.removeFromComposerJson(project, packageName);
        break;
    }
  }

  private removeFromPackageJson(project: any, packageName: string): void {
    const packageJsonFile = this.findFileInProject(project.files, 'package.json');
    if (packageJsonFile) {
      try {
        const packageData = JSON.parse(packageJsonFile.content || '{}');
        if (packageData.dependencies) {
          delete packageData.dependencies[packageName];
        }
        packageJsonFile.content = JSON.stringify(packageData, null, 2);
        packageJsonFile.lastModified = new Date();
      } catch (error) {
        console.error('Failed to update package.json:', error);
      }
    }
  }

  private removeFromRequirementsTxt(project: any, packageName: string): void {
    const requirementsFile = this.findFileInProject(project.files, 'requirements.txt');
    if (requirementsFile) {
      const currentContent = requirementsFile.content || '';
      const packages = currentContent.split('\n').filter(line => line.trim() && line.trim() !== packageName);
      requirementsFile.content = packages.join('\n') + (packages.length > 0 ? '\n' : '');
      requirementsFile.lastModified = new Date();
    }
  }

  private removeFromComposerJson(project: any, packageName: string): void {
    const composerFile = this.findFileInProject(project.files, 'composer.json');
    if (composerFile) {
      try {
        const composerData = JSON.parse(composerFile.content || '{}');
        if (composerData.require) {
          delete composerData.require[packageName];
        }
        composerFile.content = JSON.stringify(composerData, null, 2);
        composerFile.lastModified = new Date();
      } catch (error) {
        console.error('Failed to update composer.json:', error);
      }
    }
  }

  public getInstalledPackages(projectId: string): string[] {
    const project = projectManager.getProject(projectId);
    return project?.metadata.dependencies || [];
  }
}

export const dependencyService = DependencyService.getInstance();
