
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { languages, Language } from '../components/LanguageSelector';
import { projectManager } from '../services/projectManager';
import { localFileSystemService } from '../services/localFileSystemService';
import { toast } from 'sonner';

interface DependencyOption {
  name: string;
  description: string;
  popular?: boolean;
}

const dependencyOptions: Record<string, DependencyOption[]> = {
  javascript: [
    { name: 'react', description: 'React library for building user interfaces', popular: true },
    { name: 'lodash', description: 'Utility library for JavaScript', popular: true },
    { name: 'axios', description: 'Promise-based HTTP client', popular: true },
    { name: 'moment', description: 'Date manipulation library' },
    { name: 'express', description: 'Web framework for Node.js' },
  ],
  python: [
    { name: 'requests', description: 'HTTP library for Python', popular: true },
    { name: 'numpy', description: 'Scientific computing library', popular: true },
    { name: 'pandas', description: 'Data manipulation and analysis', popular: true },
    { name: 'flask', description: 'Lightweight web framework' },
    { name: 'django', description: 'Full-featured web framework' },
  ],
  php: [
    { name: 'laravel/laravel', description: 'Laravel web framework', popular: true },
    { name: 'guzzlehttp/guzzle', description: 'HTTP client library', popular: true },
    { name: 'monolog/monolog', description: 'Logging library' },
    { name: 'symfony/console', description: 'Console component' },
  ],
  cpp: [
    { name: 'boost', description: 'Portable C++ libraries', popular: true },
    { name: 'eigen', description: 'Linear algebra library' },
    { name: 'opencv', description: 'Computer vision library' },
  ],
  java: [
    { name: 'spring-boot', description: 'Spring Boot framework', popular: true },
    { name: 'junit', description: 'Testing framework', popular: true },
    { name: 'jackson', description: 'JSON processing library' },
    { name: 'apache-commons', description: 'Common utilities' },
  ],
};

const CreateProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [projectType, setProjectType] = useState<'vanilla' | 'framework'>('vanilla');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedDependencies([]);
  };

  const toggleDependency = (depName: string) => {
    setSelectedDependencies(prev => 
      prev.includes(depName) 
        ? prev.filter(d => d !== depName)
        : [...prev, depName]
    );
  };

  const handleCreateProject = async () => {
    if (!selectedLanguage || !projectName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    
    try {
      // First prompt for save location
      const saveLocationSelected = await localFileSystemService.promptForSaveLocation();
      if (!saveLocationSelected) {
        toast.error('Please select a save location to continue');
        setIsCreating(false);
        return;
      }

      const framework = projectType === 'framework' ? selectedLanguage.framework : 'vanilla';
      
      const project = projectManager.createProject(
        projectName.trim(),
        selectedLanguage.id,
        framework,
        selectedDependencies,
        projectType
      );
      
      // Save project to local file system immediately
      await localFileSystemService.saveProject(project.files, projectName.trim());
      
      toast.success('Project created and saved locally!');
      navigate('/editor');
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Project creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceedToStep2 = projectName.trim() && selectedLanguage;
  const canCreateProject = canProceedToStep2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-slate-400">Set up your development environment in just a few steps</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-700'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {step > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
            </div>
          </div>

          {step === 1 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure your project details and select technology stack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-white">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Select Language</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {languages.map((language) => (
                      <div
                        key={language.id}
                        onClick={() => handleLanguageSelect(language)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedLanguage?.id === language.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{language.icon}</span>
                          <div>
                            <div className="font-medium">{language.name}</div>
                            <div className="text-sm opacity-80">{language.framework}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLanguage && (
                  <div className="space-y-3">
                    <Label className="text-white">Project Type</Label>
                    <Select value={projectType} onValueChange={(value: 'vanilla' | 'framework') => setProjectType(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="vanilla" className="text-white">
                          Vanilla {selectedLanguage.name}
                        </SelectItem>
                        <SelectItem value="framework" className="text-white">
                          {selectedLanguage.framework} Project
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-400">
                      {projectType === 'vanilla' 
                        ? `A minimal ${selectedLanguage.name} setup for quick scripting and learning`
                        : `A complete ${selectedLanguage.framework} project with proper structure and configuration`
                      }
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && selectedLanguage && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Dependencies & Libraries</CardTitle>
                <CardDescription className="text-slate-400">
                  Select the dependencies you want to include in your {selectedLanguage.name} project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dependencyOptions[selectedLanguage.id]?.map((dep) => (
                    <div
                      key={dep.name}
                      onClick={() => toggleDependency(dep.name)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDependencies.includes(dep.name)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            {dep.name}
                            {dep.popular && (
                              <span className="ml-2 px-2 py-1 text-xs bg-orange-500 text-white rounded">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-sm opacity-80 mt-1">{dep.description}</div>
                        </div>
                        {selectedDependencies.includes(dep.name) && (
                          <Check className="h-5 w-5 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="border-slate-600 text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={!canCreateProject || isCreating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCreating ? 'Creating Project...' : 'Create & Save Project'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
