
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { Separator } from '@/components/ui/separator';
import { Save, Code, Package, Settings, Play, Wifi, WifiOff, Key, Home } from 'lucide-react';
import { toast } from 'sonner';
import DependencyManager from './DependencyManager';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExecutionSettings, { ExecutionConfig } from './ExecutionSettings';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onRunCode: () => void;
  onSave: () => void;
  isRunning: boolean;
  executionConfig: ExecutionConfig;
  onExecutionConfigChange: (config: ExecutionConfig) => void;
  isOnline: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  selectedLanguage, 
  onLanguageChange,
  onRunCode,
  onSave,
  isRunning,
  executionConfig,
  onExecutionConfigChange,
  isOnline
}) => {
  const navigate = useNavigate();
  const [isDependencyManagerOpen, setIsDependencyManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApiKeySetupOpen, setIsApiKeySetupOpen] = useState(false);
  
  const handleSave = () => {
    onSave();
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const toggleDependencyManager = () => {
    setIsDependencyManagerOpen(!isDependencyManagerOpen);
  };

  const handleApiKeySetup = () => {
    setIsApiKeySetupOpen(true);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="h-14 border-b border-editor-border bg-editor flex items-center px-4">
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleGoHome}
          className="text-white hover:bg-editor-highlight"
        >
          <Home className="h-4 w-4 mr-2" />
          Projects
        </Button>
        <h1 className="text-lg font-bold text-white">ZCHPC Code Spaces</h1>
        <span className="text-xs px-2 py-1 bg-editor-active rounded-full">Beta</span>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      
      <Separator orientation="vertical" className="mx-4 h-8 bg-editor-border" />
      
      <div className="flex-1 flex items-center space-x-4">
        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange} />
        
        <Button 
          size="sm" 
          variant="outline"
          className="bg-editor-sidebar border-editor-border text-editor-text"
          onClick={handleSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        
        <Button 
          size="sm"
          className={`${isRunning ? 'bg-yellow-600' : 'bg-green-600'} hover:${isRunning ? 'bg-yellow-700' : 'bg-green-700'} text-white`}
          onClick={onRunCode}
          disabled={isRunning}
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running...' : 'Run'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="bg-editor-sidebar border-editor-border text-editor-text"
          onClick={toggleDependencyManager}
        >
          <Package className="h-4 w-4 mr-2" />
          Packages
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="bg-editor-sidebar border-editor-border text-editor-text"
          onClick={handleSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      
      <Dialog open={isDependencyManagerOpen} onOpenChange={setIsDependencyManagerOpen}>
        <DialogContent className="bg-editor-sidebar border-editor-border text-editor-text p-0 max-w-3xl">
          <DependencyManager 
            selectedLanguage={selectedLanguage} 
            onClose={() => setIsDependencyManagerOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <ExecutionSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={executionConfig}
        onConfigChange={onExecutionConfigChange}
      />
      
      </div>
  );
};

export default Navbar;
