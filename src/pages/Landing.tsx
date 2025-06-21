
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Code, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectManager, ProjectMetadata } from '../services/projectManager';

const Landing = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState<ProjectMetadata[]>([]);

  React.useEffect(() => {
    setProjects(projectManager.getAllProjects());
  }, []);

  const handleCreateProject = () => {
    navigate('/create-project');
  };

  const handleOpenProject = (projectId: string) => {
    projectManager.setCurrentProject(projectId);
    navigate('/editor');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            ZCHPC<span className="text-blue-400">Code Space</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            A powerful multi-language code editor with integrated execution
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleCreateProject}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Project
            </Button>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <FolderOpen className="h-6 w-6 mr-2" />
              Recent Projects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="truncate">{project.name}</span>
                      <Code className="h-5 w-5 text-blue-400 flex-shrink-0 ml-2" />
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {project.language} • {project.framework}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-slate-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Last modified {formatDate(project.lastModified)}
                    </div>
                    {project.dependencies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.dependencies.slice(0, 3).map((dep) => (
                          <span 
                            key={dep}
                            className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            {dep}
                          </span>
                        ))}
                        {project.dependencies.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                            +{project.dependencies.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="bg-slate-800 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Supported Languages</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="text-slate-300">
                <div className="text-2xl mb-1">🟨</div>
                <div className="text-sm">JavaScript</div>
              </div>
              <div className="text-slate-300">
                <div className="text-2xl mb-1">🐍</div>
                <div className="text-sm">Python</div>
              </div>
              <div className="text-slate-300">
                <div className="text-2xl mb-1">🐘</div>
                <div className="text-sm">PHP</div>
              </div>
              <div className="text-slate-300">
                <div className="text-2xl mb-1">🔵</div>
                <div className="text-sm">C++</div>
              </div>
              <div className="text-slate-300">
                <div className="text-2xl mb-1">☕</div>
                <div className="text-sm">Java</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
