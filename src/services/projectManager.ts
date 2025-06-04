
export interface ProjectMetadata {
  id: string;
  name: string;
  language: string;
  framework: string;
  dependencies: string[];
  createdAt: Date;
  lastModified: Date;
  description?: string;
}

export interface Project {
  metadata: ProjectMetadata;
  files: any[]; // Will use FileNode type
}

class ProjectManager {
  private static instance: ProjectManager;
  private projects: Map<string, Project> = new Map();
  private currentProjectId: string | null = null;

  private constructor() {
    this.loadProjects();
  }

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public createProject(
    name: string,
    language: string,
    framework: string,
    dependencies: string[] = []
  ): Project {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metadata: ProjectMetadata = {
      id: projectId,
      name,
      language,
      framework,
      dependencies,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    const files = this.generateProjectStructure(language, framework, dependencies);
    
    const project: Project = {
      metadata,
      files,
    };

    this.projects.set(projectId, project);
    this.currentProjectId = projectId;
    this.saveProjects();
    
    return project;
  }

  public getAllProjects(): ProjectMetadata[] {
    return Array.from(this.projects.values()).map(p => p.metadata);
  }

  public getProject(id: string): Project | null {
    return this.projects.get(id) || null;
  }

  public getCurrentProject(): Project | null {
    if (!this.currentProjectId) return null;
    return this.getProject(this.currentProjectId);
  }

  public setCurrentProject(id: string): void {
    if (this.projects.has(id)) {
      this.currentProjectId = id;
    }
  }

  public deleteProject(id: string): void {
    this.projects.delete(id);
    if (this.currentProjectId === id) {
      this.currentProjectId = null;
    }
    this.saveProjects();
  }

  public updateProjectFiles(projectId: string, files: any[]): void {
    const project = this.projects.get(projectId);
    if (project) {
      project.files = files;
      project.metadata.lastModified = new Date();
      this.saveProjects();
    }
  }

  private generateProjectStructure(language: string, framework: string, dependencies: string[]): any[] {
    // Basic project structure based on language/framework
    const templates = {
      javascript: () => [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          children: [
            {
              id: 'index.js',
              name: 'index.js',
              type: 'file',
              extension: '.js',
              content: 'console.log("Hello, World!");'
            },
            {
              id: 'app.js',
              name: 'app.js',
              type: 'file',
              extension: '.js',
              content: '// Your React app code here\nimport React from "react";\n\nfunction App() {\n  return <div>Hello React!</div>;\n}\n\nexport default App;'
            }
          ]
        },
        {
          id: 'package.json',
          name: 'package.json',
          type: 'file',
          extension: '.json',
          content: JSON.stringify({
            name: 'my-project',
            version: '1.0.0',
            dependencies: dependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {})
          }, null, 2)
        }
      ],
      python: () => [
        {
          id: 'main.py',
          name: 'main.py',
          type: 'file',
          extension: '.py',
          content: 'print("Hello, World!")\n\n# Your Python code here'
        },
        {
          id: 'requirements.txt',
          name: 'requirements.txt',
          type: 'file',
          extension: '.txt',
          content: dependencies.join('\n')
        }
      ],
      php: () => [
        {
          id: 'index.php',
          name: 'index.php',
          type: 'file',
          extension: '.php',
          content: '<?php\necho "Hello, World!";\n?>'
        },
        {
          id: 'composer.json',
          name: 'composer.json',
          type: 'file',
          extension: '.json',
          content: JSON.stringify({
            name: 'my-project',
            require: dependencies.reduce((acc, dep) => ({ ...acc, [dep]: '^1.0' }), {})
          }, null, 2)
        }
      ]
    };

    const generator = templates[language as keyof typeof templates];
    return generator ? generator() : [
      {
        id: 'main',
        name: `main.${language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'txt'}`,
        type: 'file',
        extension: `.${language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'txt'}`,
        content: '// Hello World program'
      }
    ];
  }

  private saveProjects(): void {
    const projectsData = Array.from(this.projects.entries()).map(([id, project]) => ({
      id,
      metadata: {
        ...project.metadata,
        createdAt: project.metadata.createdAt.toISOString(),
        lastModified: project.metadata.lastModified.toISOString(),
      },
      files: project.files,
    }));
    
    localStorage.setItem('projects', JSON.stringify(projectsData));
    localStorage.setItem('currentProjectId', this.currentProjectId || '');
  }

  private loadProjects(): void {
    try {
      const projectsData = localStorage.getItem('projects');
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (projectsData) {
        const parsed = JSON.parse(projectsData);
        parsed.forEach((projectData: any) => {
          const project: Project = {
            metadata: {
              ...projectData.metadata,
              createdAt: new Date(projectData.metadata.createdAt),
              lastModified: new Date(projectData.metadata.lastModified),
            },
            files: projectData.files,
          };
          this.projects.set(projectData.id, project);
        });
      }
      
      this.currentProjectId = currentProjectId || null;
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }
}

export const projectManager = ProjectManager.getInstance();
