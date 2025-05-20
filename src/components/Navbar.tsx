
import React from 'react';
import { Button } from '@/components/ui/button';
import LanguageSelector from './LanguageSelector';
import { Separator } from '@/components/ui/separator';
import { Save, Code } from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ selectedLanguage, onLanguageChange }) => {
  const handleSave = () => {
    toast.success("File saved successfully!");
  };

  const handleRun = () => {
    toast.info("Running code...", {
      description: "Executing on remote server"
    });
    
    setTimeout(() => {
      toast.success("Code executed successfully!");
    }, 2000);
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
          className="bg-editor-active hover:bg-blue-700 text-white"
          onClick={handleRun}
        >
          <Code className="h-4 w-4 mr-2" />
          Run
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
