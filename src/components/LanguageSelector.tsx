
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Language {
  id: string;
  name: string;
  framework: string;
  extension: string;
  icon: string;
  frameworks?: string[];
  supportsWeb?: boolean;
}

export const languages: Language[] = [
  {
    id: "javascript",
    name: "JavaScript",
    framework: "Vanilla JS",
    extension: ".js",
    icon: "🟨",
    frameworks: ["Vanilla JS", "React", "Vue", "Express"],
    supportsWeb: true,
  },
  {
    id: "python",
    name: "Python",
    framework: "Standard Library",
    extension: ".py",
    icon: "🐍",
    frameworks: ["Standard Library", "Django", "Flask", "FastAPI"],
    supportsWeb: true,
  },
  {
    id: "php",
    name: "PHP",
    framework: "Vanilla PHP",
    extension: ".php",
    icon: "🐘",
    frameworks: ["Vanilla PHP", "Laravel", "Symfony", "CodeIgniter"],
    supportsWeb: true,
  },
  {
    id: "cpp",
    name: "C++",
    framework: "Standard Library",
    extension: ".cpp",
    icon: "🔵",
    frameworks: ["Standard Library", "Qt", "Boost"],
    supportsWeb: false,
  },
  {
    id: "java",
    name: "Java",
    framework: "Standard Library",
    extension: ".java",
    icon: "☕",
    frameworks: ["Standard Library", "Spring Boot", "Maven Project"],
    supportsWeb: true,
  },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onFrameworkChange?: (language: string, framework: string) => void;
  showFrameworkSelector?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  selectedLanguage, 
  onLanguageChange, 
  onFrameworkChange,
  showFrameworkSelector = true 
}) => {
  const [selectedFramework, setSelectedFramework] = useState<Record<string, string>>({});
  const [showFrameworkDropdown, setShowFrameworkDropdown] = useState<string | null>(null);

  const currentLanguage = languages.find(lang => lang.id === selectedLanguage);
  const currentFramework = selectedFramework[selectedLanguage] || currentLanguage?.framework;

  const handleLanguageSelect = (languageId: string) => {
    onLanguageChange(languageId);
    if (showFrameworkSelector) {
      setShowFrameworkDropdown(languageId);
    }
  };

  const handleFrameworkSelect = (framework: string) => {
    setSelectedFramework(prev => ({
      ...prev,
      [selectedLanguage]: framework
    }));
    setShowFrameworkDropdown(null);
    onFrameworkChange?.(selectedLanguage, framework);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
        <SelectTrigger className="w-[180px] bg-editor-sidebar border-editor-border text-editor-text">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="bg-editor-sidebar text-editor-text">
          {languages.map((lang) => (
            <SelectItem key={lang.id} value={lang.id} className="focus:bg-editor-highlight">
              <div className="flex items-center">
                <span className="mr-2">{lang.icon}</span>
                <span>{lang.name}</span>
                {lang.supportsWeb && (
                  <Badge variant="secondary" className="ml-2 text-xs">Web</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showFrameworkSelector && currentLanguage && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFrameworkDropdown(showFrameworkDropdown === selectedLanguage ? null : selectedLanguage)}
            className="bg-editor-sidebar border-editor-border text-editor-text"
          >
            {currentFramework}
            <span className="ml-1">▼</span>
          </Button>
          
          {showFrameworkDropdown === selectedLanguage && (
            <Card className="absolute top-full left-0 mt-1 z-50 w-48 bg-editor-sidebar border-editor-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-editor-text">Select Framework</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {currentLanguage.frameworks?.map((framework) => (
                  <Button
                    key={framework}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start mb-1 text-editor-text hover:bg-editor-highlight ${
                      currentFramework === framework ? 'bg-editor-active' : ''
                    }`}
                    onClick={() => handleFrameworkSelect(framework)}
                  >
                    {framework}
                    {framework === 'Vanilla JS' || framework === 'Standard Library' || framework === 'Vanilla PHP' ? (
                      <Badge variant="outline" className="ml-auto text-xs">Vanilla</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto text-xs">Framework</Badge>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
