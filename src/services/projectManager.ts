export interface ProjectMetadata {
  id: string;
  name: string;
  language: string;
  framework: string;
  dependencies: string[];
  createdAt: Date;
  lastModified: Date;
  description?: string;
  projectType: 'vanilla' | 'framework';
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
    dependencies: string[] = [],
    projectType: 'vanilla' | 'framework' = 'vanilla'
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
      projectType,
    };

    const files = this.generateProjectStructure(language, framework, dependencies, projectType);
    
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

  private generateProjectStructure(language: string, framework: string, dependencies: string[], projectType: 'vanilla' | 'framework'): any[] {
    if (projectType === 'vanilla') {
      return this.generateVanillaProject(language, dependencies);
    } else {
      return this.generateFrameworkProject(language, framework, dependencies);
    }
  }

  private generateVanillaProject(language: string, dependencies: string[]): any[] {
    const templates = {
      javascript: () => [
        {
          id: 'main.js',
          name: 'main.js',
          type: 'file',
          extension: '.js',
          content: 'console.log("Hello, World!");'
        },
        {
          id: 'package.json',
          name: 'package.json',
          type: 'file',
          extension: '.json',
          content: JSON.stringify({
            name: 'vanilla-js-project',
            version: '1.0.0',
            main: 'main.js',
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
            name: 'vanilla-php-project',
            require: dependencies.reduce((acc, dep) => ({ ...acc, [dep]: '^1.0' }), {})
          }, null, 2)
        }
      ],
      cpp: () => [
        {
          id: 'main.cpp',
          name: 'main.cpp',
          type: 'file',
          extension: '.cpp',
          content: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
        }
      ],
      java: () => [
        {
          id: 'Main.java',
          name: 'Main.java',
          type: 'file',
          extension: '.java',
          content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
        }
      ]
    };

    const generator = templates[language as keyof typeof templates];
    return generator ? generator() : [];
  }

  private generateFrameworkProject(language: string, framework: string, dependencies: string[]): any[] {
    const frameworkTemplates = {
      javascript: {
        React: () => [
          {
            id: 'public',
            name: 'public',
            type: 'folder',
            children: [
              {
                id: 'index.html',
                name: 'index.html',
                type: 'file',
                extension: '.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
              }
            ]
          },
          {
            id: 'src',
            name: 'src',
            type: 'folder',
            children: [
              {
                id: 'App.js',
                name: 'App.js',
                type: 'file',
                extension: '.js',
                content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>Edit src/App.js and save to reload.</p>
      </header>
    </div>
  );
}

export default App;`
              },
              {
                id: 'App.css',
                name: 'App.css',
                type: 'file',
                extension: '.css',
                content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}`
              },
              {
                id: 'index.js',
                name: 'index.js',
                type: 'file',
                extension: '.js',
                content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`
              }
            ]
          },
          {
            id: 'package.json',
            name: 'package.json',
            type: 'file',
            extension: '.json',
            content: JSON.stringify({
              name: 'react-app',
              version: '1.0.0',
              dependencies: {
                react: '^18.0.0',
                'react-dom': '^18.0.0',
                ...dependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {})
              },
              scripts: {
                start: 'react-scripts start',
                build: 'react-scripts build'
              }
            }, null, 2)
          }
        ]
      },
      python: {
        Django: () => [
          {
            id: 'manage.py',
            name: 'manage.py',
            type: 'file',
            extension: '.py',
            content: `#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)`
          },
          {
            id: 'myproject',
            name: 'myproject',
            type: 'folder',
            children: [
              {
                id: 'settings.py',
                name: 'settings.py',
                type: 'file',
                extension: '.py',
                content: `import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'your-secret-key-here'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

ROOT_URLCONF = 'myproject.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}`
              },
              {
                id: 'urls.py',
                name: 'urls.py',
                type: 'file',
                extension: '.py',
                content: `from django.contrib import admin
from django.urls import path
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello, Django!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
]`
              }
            ]
          },
          {
            id: 'requirements.txt',
            name: 'requirements.txt',
            type: 'file',
            extension: '.txt',
            content: ['django>=4.0', ...dependencies].join('\n')
          }
        ]
      }
    };

    const langTemplates = frameworkTemplates[language as keyof typeof frameworkTemplates];
    if (langTemplates && langTemplates[framework as keyof typeof langTemplates]) {
      return langTemplates[framework as keyof typeof langTemplates]();
    }

    return this.generateVanillaProject(language, dependencies);
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
