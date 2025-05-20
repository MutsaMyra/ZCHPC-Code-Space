
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Language {
  id: string;
  name: string;
  framework: string;
  extension: string;
  icon: string;
}

export const languages: Language[] = [
  {
    id: "javascript",
    name: "JavaScript",
    framework: "React",
    extension: ".jsx",
    icon: "🟨",
  },
  {
    id: "python",
    name: "Python",
    framework: "Jupyter Notebooks",
    extension: ".ipynb",
    icon: "🐍",
  },
  {
    id: "php",
    name: "PHP",
    framework: "Laravel",
    extension: ".php",
    icon: "🐘",
  },
  {
    id: "cpp",
    name: "C++",
    framework: "Standard Library",
    extension: ".cpp",
    icon: "🔵",
  },
  {
    id: "java",
    name: "Java",
    framework: "Spring Boot",
    extension: ".java",
    icon: "☕",
  },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <Select value={selectedLanguage} onValueChange={onLanguageChange}>
      <SelectTrigger className="w-[180px] bg-editor-sidebar border-editor-border text-editor-text">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent className="bg-editor-sidebar text-editor-text">
        {languages.map((lang) => (
          <SelectItem key={lang.id} value={lang.id} className="focus:bg-editor-highlight">
            <div className="flex items-center">
              <span className="mr-2">{lang.icon}</span>
              <span>{lang.name} ({lang.framework})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
