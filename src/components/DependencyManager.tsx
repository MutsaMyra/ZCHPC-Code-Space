
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, PackagePlus, PackageSearch } from "lucide-react";
import { toast } from 'sonner';
import { languages } from './LanguageSelector';

// Mock package database for demo purposes
const mockPackages: Record<string, any[]> = {
  javascript: [
    { name: 'react-router', description: 'Declarative routing for React', version: '6.18.0', popularity: 'High' },
    { name: 'axios', description: 'Promise based HTTP client', version: '1.5.0', popularity: 'High' },
    { name: 'lodash', description: 'Modern JavaScript utility library', version: '4.17.21', popularity: 'High' },
    { name: 'formik', description: 'Forms in React, made easy', version: '2.4.5', popularity: 'Medium' },
    { name: 'zustand', description: 'Small, fast state-management', version: '4.4.1', popularity: 'Medium' },
  ],
  python: [
    { name: 'pandas', description: 'Data analysis library', version: '2.1.1', popularity: 'High' },
    { name: 'numpy', description: 'Scientific computing library', version: '1.26.0', popularity: 'High' },
    { name: 'matplotlib', description: 'Visualization library', version: '3.8.0', popularity: 'High' },
    { name: 'scikit-learn', description: 'Machine learning library', version: '1.3.1', popularity: 'Medium' },
    { name: 'requests', description: 'HTTP library', version: '2.31.0', popularity: 'High' },
  ],
  php: [
    { name: 'guzzlehttp/guzzle', description: 'HTTP client', version: '7.8.0', popularity: 'High' },
    { name: 'symfony/console', description: 'Console component', version: '6.3.4', popularity: 'High' },
    { name: 'phpunit/phpunit', description: 'Testing framework', version: '10.4.1', popularity: 'High' },
    { name: 'laravel/sanctum', description: 'API authentication', version: '3.3.1', popularity: 'Medium' },
    { name: 'doctrine/orm', description: 'Object-relational mapper', version: '2.16.1', popularity: 'Medium' },
  ],
  cpp: [
    { name: 'boost', description: 'Collection of C++ libraries', version: '1.83.0', popularity: 'High' },
    { name: 'eigen', description: 'C++ template library for linear algebra', version: '3.4.0', popularity: 'Medium' },
    { name: 'fmt', description: 'A modern formatting library', version: '10.1.1', popularity: 'Medium' },
    { name: 'nlohmann/json', description: 'JSON for Modern C++', version: '3.11.3', popularity: 'High' },
    { name: 'catch2', description: 'Testing framework', version: '3.4.0', popularity: 'High' },
  ],
  java: [
    { name: 'spring-boot-starter', description: 'Spring Boot core', version: '3.1.5', popularity: 'High' },
    { name: 'lombok', description: 'Automatic resource management', version: '1.18.30', popularity: 'High' },
    { name: 'junit-jupiter', description: 'Testing framework', version: '5.10.0', popularity: 'High' },
    { name: 'hibernate-core', description: 'ORM framework', version: '6.3.1', popularity: 'Medium' },
    { name: 'jackson-databind', description: 'JSON parser', version: '2.15.3', popularity: 'High' },
  ],
};

interface DependencyManagerProps {
  selectedLanguage: string;
  onClose: () => void;
}

const DependencyManager: React.FC<DependencyManagerProps> = ({ selectedLanguage, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  
  const currentLanguage = languages.find(lang => lang.id === selectedLanguage);
  const frameworkName = currentLanguage?.framework || '';
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredPackages = mockPackages[selectedLanguage]?.filter(pkg => 
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const handleInstall = (packageName: string) => {
    if (!installedPackages.includes(packageName)) {
      setInstalledPackages([...installedPackages, packageName]);
      toast.success(`Installed ${packageName} successfully!`, {
        description: "Package added to your project"
      });
    } else {
      toast.info(`${packageName} is already installed.`);
    }
  };
  
  const handleUninstall = (packageName: string) => {
    setInstalledPackages(installedPackages.filter(pkg => pkg !== packageName));
    toast.success(`Uninstalled ${packageName} successfully!`, {
      description: "Package removed from your project"
    });
  };

  return (
    <Card className="w-full max-w-3xl bg-editor-sidebar border-editor-border text-editor-text">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Dependency Manager
          <span className="ml-2 text-sm font-normal text-editor-text-muted">
            ({frameworkName})
          </span>
        </CardTitle>
        <CardDescription className="text-editor-text-muted">
          Search and install packages for your {currentLanguage?.name} project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center mb-2 space-x-2">
            <PackageSearch className="h-5 w-5 text-editor-text-muted" />
            <Input 
              placeholder="Search packages..." 
              value={searchTerm}
              onChange={handleSearch}
              className="bg-editor-input border-editor-border text-editor-text"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Available Packages</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => (
                <div 
                  key={pkg.name} 
                  className="flex items-center justify-between p-2 rounded-md bg-editor hover:bg-editor-highlight"
                >
                  <div>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-xs text-editor-text-muted">{pkg.description}</div>
                    <div className="text-xs text-editor-text-muted">v{pkg.version} · Popularity: {pkg.popularity}</div>
                  </div>
                  <Button 
                    size="sm"
                    variant={installedPackages.includes(pkg.name) ? "outline" : "default"}
                    onClick={() => installedPackages.includes(pkg.name) 
                      ? handleUninstall(pkg.name) 
                      : handleInstall(pkg.name)
                    }
                    className={installedPackages.includes(pkg.name) 
                      ? "bg-editor-sidebar border-editor-border text-editor-text" 
                      : "bg-editor-active"
                    }
                  >
                    {installedPackages.includes(pkg.name) ? "Uninstall" : "Install"}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-editor-text-muted">
                No packages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {installedPackages.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Installed Packages</h3>
            <div className="p-2 rounded-md bg-editor-highlight">
              {installedPackages.map(pkg => (
                <div key={pkg} className="flex items-center text-sm py-1">
                  <PackagePlus className="h-4 w-4 mr-2 text-green-400" />
                  {pkg}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="bg-editor-sidebar border-editor-border text-editor-text"
        >
          Close
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DependencyManager;
