
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, PackagePlus, PackageSearch, Download, Wifi, WifiOff } from "lucide-react";
import { toast } from 'sonner';
import { languages } from './LanguageSelector';
import { dependencyService, PackageInfo } from '../services/dependencyService';
import { projectManager } from '../services/projectManager';

interface DependencyManagerProps {
  selectedLanguage: string;
  onClose: () => void;
}

const DependencyManager: React.FC<DependencyManagerProps> = ({ selectedLanguage, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const currentLanguage = languages.find(lang => lang.id === selectedLanguage);
  const frameworkName = currentLanguage?.framework || '';
  const currentProject = projectManager.getCurrentProject();
  
  useEffect(() => {
    // Load installed packages
    if (currentProject) {
      setInstalledPackages(dependencyService.getInstalledPackages(currentProject.metadata.id));
    }
    
    // Load initial packages
    handleSearch('');
  }, [currentProject]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await dependencyService.searchPackages(query, selectedLanguage);
      setPackages(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search packages');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  const handleInstall = async (packageName: string) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    if (installedPackages.includes(packageName)) {
      toast.info(`${packageName} is already installed.`);
      return;
    }

    const success = await dependencyService.installPackage(
      packageName, 
      selectedLanguage, 
      currentProject.metadata.id
    );

    if (success) {
      setInstalledPackages([...installedPackages, packageName]);
    }
  };
  
  const handleUninstall = (packageName: string) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    const success = dependencyService.removePackage(packageName, currentProject.metadata.id);
    
    if (success) {
      setInstalledPackages(installedPackages.filter(pkg => pkg !== packageName));
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-editor-sidebar border-editor-border text-editor-text">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Dependency Manager
            <span className="ml-2 text-sm font-normal text-editor-text-muted">
              ({frameworkName})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center text-green-400 text-xs">
                <Wifi className="h-4 w-4 mr-1" />
                Online Search
              </div>
            ) : (
              <div className="flex items-center text-yellow-400 text-xs">
                <WifiOff className="h-4 w-4 mr-1" />
                Cached Only
              </div>
            )}
          </div>
        </CardTitle>
        <CardDescription className="text-editor-text-muted">
          Search and install packages for your {currentLanguage?.name} project
          {!isOnline && ' (offline mode - showing cached packages only)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center mb-2 space-x-2">
            <PackageSearch className="h-5 w-5 text-editor-text-muted" />
            <Input 
              placeholder={isOnline ? "Search packages from web..." : "Search cached packages..."} 
              value={searchTerm}
              onChange={handleSearchInput}
              className="bg-editor-input border-editor-border text-editor-text"
            />
            {isSearching && (
              <div className="text-xs text-editor-text-muted">Searching...</div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            Available Packages
            {!isOnline && (
              <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">
                Offline Cache
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <div 
                  key={pkg.name} 
                  className="flex items-center justify-between p-3 rounded-md bg-editor hover:bg-editor-highlight border border-editor-border"
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      {pkg.name}
                      {pkg.homepage && isOnline && (
                        <a 
                          href={pkg.homepage} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-blue-400 hover:underline"
                        >
                          Homepage
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-editor-text-muted">{pkg.description}</div>
                    <div className="text-xs text-editor-text-muted">
                      v{pkg.version} · Popularity: {pkg.popularity}
                      {pkg.downloads && ` · Downloads: ${pkg.downloads}`}
                    </div>
                    {pkg.keywords && (
                      <div className="text-xs text-editor-text-muted mt-1">
                        Tags: {pkg.keywords.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isOnline && !installedPackages.includes(pkg.name) && (
                      <Download className="h-4 w-4 text-blue-400" />
                    )}
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
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-editor-text-muted">
                {isSearching ? 'Searching...' : `No packages found${searchTerm ? ` matching "${searchTerm}"` : ''}`}
              </div>
            )}
          </div>
        </div>

        {installedPackages.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Installed Packages ({installedPackages.length})</h3>
            <div className="p-3 rounded-md bg-editor-highlight border border-editor-border">
              <div className="grid grid-cols-2 gap-2">
                {installedPackages.map(pkg => (
                  <div key={pkg} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center">
                      <PackagePlus className="h-4 w-4 mr-2 text-green-400" />
                      {pkg}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUninstall(pkg)}
                      className="h-6 px-2 text-red-400 hover:bg-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-xs text-editor-text-muted">
          {isOnline 
            ? 'Packages will be downloaded from the web and cached locally' 
            : 'Connect to internet to search and download new packages'
          }
        </div>
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
