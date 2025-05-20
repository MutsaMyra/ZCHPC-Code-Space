
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { Separator } from '@/components/ui/separator';
import { Save, Code, Package, Settings, Play } from 'lucide-react';
import { toast } from 'sonner';
import DependencyManager from './DependencyManager';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ExecutionSettings, { ExecutionConfig } from './ExecutionSettings';

interface NavbarProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onRunCode: () => void;
  isRunning: boolean;
  executionConfig: ExecutionConfig;
  onExecutionConfigChange: (config: ExecutionConfig) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  selectedLanguage, 
  onLanguageChange,
  onRunCode,
  isRunning,
  executionConfig,
  onExecutionConfigChange
}) => {
  const [isDependencyManagerOpen, setIsDependencyManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const handleSave = () => {
    toast.success("File saved successfully!");
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const toggleDependencyManager = () => {
    setIsDependencyManagerOpen(!isDependencyManagerOpen);
  };

  return (
    <div className="h-14 border-b border-editor-border bg-editor flex items-center px-4">
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-bold text-white">CodeCraft</h1>
        <span className="text-xs px-2 py-1 bg-editor-active rounded-full">Beta</span>
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
