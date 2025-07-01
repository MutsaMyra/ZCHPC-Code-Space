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

export interface FrameworkTemplate {
  name: string;
  description: string;
  language: string;
  dependencies: string[];
  files: any[];
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

  public getAvailableFrameworks(language: string): FrameworkTemplate[] {
    const frameworks: Record<string, FrameworkTemplate[]> = {
      javascript: [
        {
          name: 'React',
          description: 'A JavaScript library for building user interfaces',
          language: 'javascript',
          dependencies: ['react', 'react-dom'],
          files: []
        },
        {
          name: 'Express',
          description: 'Fast, unopinionated, minimalist web framework for Node.js',
          language: 'javascript',
          dependencies: ['express'],
          files: []
        },
        {
          name: 'Vue',
          description: 'The Progressive JavaScript Framework',
          language: 'javascript',
          dependencies: ['vue'],
          files: []
        }
      ],
      python: [
        {
          name: 'Flask',
          description: 'A lightweight WSGI web application framework',
          language: 'python',
          dependencies: ['flask'],
          files: []
        },
        {
          name: 'Django',
          description: 'A high-level Python web framework',
          language: 'python',
          dependencies: ['django'],
          files: []
        },
        {
          name: 'FastAPI',
          description: 'Modern, fast web framework for building APIs with Python',
          language: 'python',
          dependencies: ['fastapi', 'uvicorn'],
          files: []
        }
      ],
      php: [
        {
          name: 'Laravel',
          description: 'A PHP framework for web artisans',
          language: 'php',
          dependencies: ['laravel/framework'],
          files: []
        },
        {
          name: 'Slim',
          description: 'Slim is a PHP micro framework',
          language: 'php',
          dependencies: ['slim/slim'],
          files: []
        }
      ],
      java: [
        {
          name: 'Spring Boot',
          description: 'Create stand-alone, production-grade Spring based Applications',
          language: 'java',
          dependencies: ['spring-boot-starter-web'],
          files: []
        },
        {
          name: 'Maven',
          description: 'Apache Maven project structure',
          language: 'java',
          dependencies: [],
          files: []
        }
      ],
      ruby: [
        {
          name: 'Rails',
          description: 'A web-application framework written in Ruby',
          language: 'ruby',
          dependencies: ['rails'],
          files: []
        },
        {
          name: 'Sinatra',
          description: 'A DSL for quickly creating web applications in Ruby',
          language: 'ruby',
          dependencies: ['sinatra'],
          files: []
        }
      ]
    };

    return frameworks[language.toLowerCase()] || [];
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
    switch (language) {
      case 'javascript':
        return [
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
        ];
      case 'python':
        return [
          {
            id: 'main.py',
            name: 'main.py',
            type: 'file',
            extension: '.py',
            content: 'print("Hello, World!")\n\n# Your Python code here\n# Use input() for interactive programs\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")'
          },
          {
            id: 'requirements.txt',
            name: 'requirements.txt',
            type: 'file',
            extension: '.txt',
            content: dependencies.join('\n')
          }
        ];
      case 'php':
        return [
          {
            id: 'index.php',
            name: 'index.php',
            type: 'file',
            extension: '.php',
            content: '<?php\necho "Hello, World!";\n\n// Your PHP code here\n?>'
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
        ];
      case 'cpp':
        return [
          {
            id: 'main.cpp',
            name: 'main.cpp',
            type: 'file',
            extension: '.cpp',
            content: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    \n    string name;\n    cout << "Enter your name: ";\n    cin >> name;\n    cout << "Hello, " << name << "!" << endl;\n    \n    return 0;\n}'
          },
          {
            id: 'Makefile',
            name: 'Makefile',
            type: 'file',
            extension: '',
            content: 'CXX=g++\nCXXFLAGS=-std=c++17 -Wall\nTARGET=main\nSOURCE=main.cpp\n\n$(TARGET): $(SOURCE)\n\t$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE)\n\nclean:\n\trm -f $(TARGET)\n\n.PHONY: clean'
          }
        ];
      case 'java':
        return [
          {
            id: 'Main.java',
            name: 'Main.java',
            type: 'file',
            extension: '.java',
            content: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        Scanner scanner = new Scanner(System.in);\n        System.out.print("Enter your name: ");\n        String name = scanner.nextLine();\n        System.out.println("Hello, " + name + "!");\n        \n        scanner.close();\n    }\n}'
          }
        ];
      case 'ruby':
        return [
          {
            id: 'main.rb',
            name: 'main.rb',
            type: 'file',
            extension: '.rb',
            content: 'puts "Hello, World!"\n\n# Your Ruby code here\nprint "Enter your name: "\nname = gets.chomp\nputs "Hello, #{name}!"'
          },
          {
            id: 'Gemfile',
            name: 'Gemfile',
            type: 'file',
            extension: '',
            content: `source 'https://rubygems.org'\n\nruby '3.0.0'\n\n${dependencies.map(dep => `gem '${dep}'`).join('\n')}`
          }
        ];
      default:
        return [];
    }
  }

  private generateFrameworkProject(language: string, framework: string, dependencies: string[]): any[] {
    if (language === 'javascript' && framework === 'React') {
      return [
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
      ];
    } else if (language === 'python' && framework === 'Flask') {
      return [
        {
          id: 'app.py',
          name: 'app.py',
          type: 'file',
          extension: '.py',
          content: `from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/hello', methods=['GET', 'POST'])
def hello():
    if request.method == 'POST':
        name = request.json.get('name', 'World')
        return {'message': f'Hello, {name}!'}
    return {'message': 'Hello, World!'}

if __name__ == '__main__':
    app.run(debug=True)`
        },
        {
          id: 'templates',
          name: 'templates',
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
    <title>Flask App</title>
</head>
<body>
    <h1>Welcome to Flask!</h1>
    <p>Your Flask application is running.</p>
</body>
</html>`
            }
          ]
        },
        {
          id: 'requirements.txt',
          name: 'requirements.txt',
          type: 'file',
          extension: '.txt',
          content: ['flask', ...dependencies].join('\n')
        }
      ];
    } else if (language === 'python' && framework === 'Django') {
      return [
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
      ];
    } else if (language === 'java' && framework === 'Spring Boot') {
      return [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          children: [
            {
              id: 'main',
              name: 'main',
              type: 'folder',
              children: [
                {
                  id: 'java',
                  name: 'java',
                  type: 'folder',
                  children: [
                    {
                      id: 'Application.java',
                      name: 'Application.java',
                      type: 'file',
                      extension: '.java',
                      content: `import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class Application {
    
    @GetMapping("/")
    public String home() {
        return "Hello, Spring Boot!";
    }
    
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'pom.xml',
          name: 'pom.xml',
          type: 'file',
          extension: '.xml',
          content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-app</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>11</java.version>
        <spring.boot.version>2.7.0</spring.boot.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>\${spring.boot.version}</version>
        </dependency>
    </dependencies>
</project>`
        }
      ];
    } else if (language === 'ruby' && framework === 'Rails') {
      return [
        {
          id: 'app',
          name: 'app',
          type: 'folder',
          children: [
            {
              id: 'controllers',
              name: 'controllers',
              type: 'folder',
              children: [
                {
                  id: 'application_controller.rb',
                  name: 'application_controller.rb',
                  type: 'file',
                  extension: '.rb',
                  content: `class ApplicationController < ActionController::Base
  def index
    render plain: 'Hello, Rails!'
  end
end`
                }
              ]
            }
          ]
        },
        {
          id: 'config',
          name: 'config',
          type: 'folder',
          children: [
            {
              id: 'routes.rb',
              name: 'routes.rb',
              type: 'file',
              extension: '.rb',
              content: `Rails.application.routes.draw do
  root 'application#index'
end`
            }
          ]
        },
        {
          id: 'Gemfile',
          name: 'Gemfile',
          type: 'file',
          extension: '',
          content: `source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.0.0'

gem 'rails', '~> 7.0.0'
${dependencies.map(dep => `gem '${dep}'`).join('\n')}`
        }
      ];
    } else if (language === 'php' && framework === 'Laravel') {
      return [
        {
          id: 'app',
          name: 'app',
          type: 'folder',
          children: [
            {
              id: 'Http',
              name: 'Http',
              type: 'folder',
              children: [
                {
                  id: 'Controllers',
                  name: 'Controllers',
                  type: 'folder',
                  children: [
                    {
                      id: 'HomeController.php',
                      name: 'HomeController.php',
                      type: 'file',
                      extension: '.php',
                      content: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;

class HomeController extends Controller
{
    public function index()
    {
        return view('welcome');
    }
}
`
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'routes',
          name: 'routes',
          type: 'folder',
          children: [
            {
              id: 'web.php',
              name: 'web.php',
              type: 'file',
              extension: '.php',
              content: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\HomeController;

Route::get('/', [HomeController::class, 'index']);
`
            }
          ]
        },
        {
          id: 'resources',
          name: 'resources',
          type: 'folder',
          children: [
            {
              id: 'views',
              name: 'views',
              type: 'folder',
              children: [
                {
                  id: 'welcome.blade.php',
                  name: 'welcome.blade.php',
                  type: 'file',
                  extension: '.php',
                  content: `<!DOCTYPE html>
<html>
<head>
    <title>Laravel</title>
</head>
<body>
    <h1>Welcome to Laravel!</h1>
    <p>Your Laravel application is running.</p>
</body>
</html>`
                }
              ]
            }
          ]
        },
        {
          id: 'composer.json',
          name: 'composer.json',
          type: 'file',
          extension: '.json',
          content: JSON.stringify({
            name: 'laravel/laravel',
            require: {
              'laravel/framework': '^9.0',
              ...dependencies.reduce((acc, dep) => ({ ...acc, [dep]: '^1.0' }), {})
            }
          }, null, 2)
        }
      ];
    }

    // Fallback to vanilla project if framework is not supported
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
