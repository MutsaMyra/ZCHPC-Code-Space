
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { toast } from 'sonner';
import { projectManager } from '../services/projectManager';
import { v4 as uuidv4 } from 'uuid';
import { FileNode } from '../components/FileExplorer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Language {
  id: string;
  name: string;
  icon: string;
  description: string;
  extensions: string[];
}

interface Framework {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const languages: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: '⚛️',
    description: 'The most popular language in the world',
    extensions: ['.js', '.jsx']
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🟦',
    description: 'A superset of JavaScript that adds static typing',
    extensions: ['.ts', '.tsx']
  },
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    description: 'A general-purpose programming language',
    extensions: ['.py']
  },
  {
    id: 'java',
    name: 'Java',
    icon: '☕',
    description: 'A widely used object-oriented programming language',
    extensions: ['.java']
  },
  {
    id: 'cpp',
    name: 'C++',
    icon: '⚡',
    description: 'A powerful system programming language',
    extensions: ['.cpp', '.cc', '.cxx']
  },
  {
    id: 'html',
    name: 'HTML',
    icon: '🌐',
    description: 'The standard markup language for creating web pages',
    extensions: ['.html', '.htm']
  },
  {
    id: 'css',
    name: 'CSS',
    icon: '🎨',
    description: 'A style sheet language used for describing the presentation of a document',
    extensions: ['.css']
  },
  {
    id: 'php',
    name: 'PHP',
    icon: '🐘',
    description: 'A popular general-purpose scripting language that is especially suited to web development.',
    extensions: ['.php']
  },
];

const frameworks: { [languageId: string]: Framework[] } = {
  javascript: [
    {
      id: 'react',
      name: 'React',
      icon: '⚛️',
      description: 'A JavaScript library for building user interfaces'
    },
    {
      id: 'vue',
      name: 'Vue',
      icon: '🌱',
      description: 'An approachable, performant and versatile framework for building web user interfaces.'
    },
    {
      id: 'angular',
      name: 'Angular',
      icon: '🅰️',
      description: 'The modern web developer\'s platform'
    },
    {
      id: 'Vanilla',
      name: 'Vanilla',
      icon: '🍦',
      description: 'Write plain Javascript'
    }
  ],
  typescript: [
    {
      id: 'react',
      name: 'React',
      icon: '⚛️',
      description: 'A JavaScript library for building user interfaces'
    },
    {
      id: 'angular',
      name: 'Angular',
      icon: '🅰️',
      description: 'The modern web developer\'s platform'
    },
    {
      id: 'Vanilla',
      name: 'Vanilla',
      icon: '🍦',
      description: 'Write plain Typescript'
    }
  ],
  html: [
    {
      id: 'Vanilla',
      name: 'Vanilla',
      icon: '🍦',
      description: 'Write plain HTML'
    }
  ],
  css: [
    {
      id: 'Vanilla',
      name: 'Vanilla',
      icon: '🍦',
      description: 'Write plain CSS'
    }
  ],
  php: [
    {
      id: 'Laravel',
      name: 'Laravel',
      icon: '🍃',
      description: 'The PHP Framework for Web Artisans'
    },
    {
      id: 'Symfony',
      name: 'Symfony',
      icon: '🌿',
      description: 'High-performance PHP framework for web development'
    },
    {
      id: 'CodeIgniter',
      name: 'CodeIgniter',
      icon: '🔥',
      description: 'A powerful PHP framework with a very small footprint'
    },
    {
      id: 'Vanilla',
      name: 'Vanilla',
      icon: '🍦',
      description: 'Write plain PHP'
    }
  ]
};

const quickStartTemplates = [
  {
    id: 'hello-world',
    name: 'Hello World',
    icon: '👋',
    description: 'A basic template that prints "Hello, World!" to the console.'
  },
  {
    id: 'basic-server',
    name: 'Basic Server',
    icon: '🚀',
    description: 'A simple server setup to handle basic HTTP requests.'
  },
  {
    id: 'react-app',
    name: 'React App',
    icon: '⚛️',
    description: 'A simple react app.'
  },
];

const CreateProject = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    document.title = 'New Project | ZCHPC Code Spaces';
  }, []);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
    setSelectedFramework(null);
  };

  const getFrameworksForLanguage = (languageId: string): Framework[] => {
    return frameworks[languageId] || [];
  };

  const handleFrameworkChange = (framework: string) => {
    // Disabled - show tooltip instead
    return;
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!selectedLanguage) {
      toast.error('Please select a language');
      return;
    }

    setIsCreating(true);

    try {
      const project = await projectManager.createProject(
        projectName,
        selectedLanguage,
        selectedFramework || 'Vanilla',
        [], // dependencies array
        'vanilla' // projectType
      );

      // Set description separately if the project manager supports it
      if (description && project.metadata) {
        project.metadata.description = description;
      }

      toast.success('Project created successfully!');
      navigate(`/editor/${project.metadata.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickStart = async (templateId: string) => {
    toast.info(`Loading quick start template: ${templateId}`);
  };

  return (
    <div className="min-h-screen bg-editor">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-editor-text-muted">Choose your language and framework to get started</p>
          </div>

          <Card className="bg-editor-sidebar border-editor-border">
            <CardContent className="p-6 space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-editor-text">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="bg-editor border-editor-border text-editor-text"
                />
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <Label className="text-editor-text">Programming Language</Label>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <div
                      key={lang.id}
                      onClick={() => handleLanguageSelect(lang.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedLanguage === lang.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-editor-border bg-editor-active hover:border-editor-border-hover'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.icon}</span>
                        <div>
                          <h3 className="font-medium text-editor-text">{lang.name}</h3>
                          <p className="text-sm text-editor-text-muted">{lang.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Framework Selection - Disabled */}
              {selectedLanguage && (
                <div className="space-y-3">
                  <Label className="text-editor-text">Framework (Optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="grid grid-cols-2 gap-3 opacity-50 cursor-not-allowed">
                          {getFrameworksForLanguage(selectedLanguage).map((framework) => (
                            <div
                              key={framework.id}
                              className="p-3 rounded-lg border border-editor-border bg-editor-active"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{framework.icon}</span>
                                <div>
                                  <h4 className="font-medium text-editor-text text-sm">{framework.name}</h4>
                                  <p className="text-xs text-editor-text-muted">{framework.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Feature coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* Project Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-editor-text">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  className="bg-editor border-editor-border text-editor-text"
                  rows={3}
                />
              </div>

              {/* Create Button */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || !selectedLanguage || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="bg-editor-sidebar border-editor-border text-editor-text"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* Quick Start Templates */}
              <div className="mt-8 pt-6 border-t border-editor-border">
                <h3 className="text-lg font-medium text-editor-text mb-4">Quick Start Templates</h3>
                <div className="grid grid-cols-1 gap-3">
                  {quickStartTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleQuickStart(template.id)}
                      className="p-4 rounded-lg border border-editor-border bg-editor-active hover:border-editor-border-hover cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{template.icon}</span>
                          <div>
                            <h4 className="font-medium text-editor-text">{template.name}</h4>
                            <p className="text-sm text-editor-text-muted">{template.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-editor-text-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
