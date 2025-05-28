
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeySetupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingKey = localStorage.getItem('judge0_api_key');
      if (existingKey) {
        setHasExistingKey(true);
        setApiKey(''); // Don't show the actual key for security
      } else {
        setHasExistingKey(false);
        setApiKey('');
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    localStorage.setItem('judge0_api_key', apiKey.trim());
    toast.success('API key saved successfully');
    setHasExistingKey(true);
    onClose();
  };

  const handleRemove = () => {
    localStorage.removeItem('judge0_api_key');
    toast.success('API key removed');
    setHasExistingKey(false);
    setApiKey('');
  };

  const handleTest = async () => {
    const testApiKey = apiKey.trim() || localStorage.getItem('judge0_api_key');
    
    if (!testApiKey) {
      toast.error('No API key to test');
      return;
    }

    try {
      toast.info('Testing API key...');
      
      // Test with a simple submission
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': testApiKey,
        },
        body: JSON.stringify({
          source_code: 'console.log("Hello, World!");',
          language_id: 63, // Node.js
          stdin: '',
        }),
      });

      if (response.ok) {
        toast.success('API key is working correctly!');
      } else {
        toast.error(`API key test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      toast.error('Failed to test API key. Check your internet connection.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-editor-sidebar border-editor-border text-editor-text max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configure Judge0 API
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasExistingKey && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                API key is configured and ready to use for online code execution.
              </AlertDescription>
            </Alert>
          )}
          
          {!hasExistingKey && (
            <Alert>
              <AlertDescription>
                To enable real code execution, you need a Judge0 API key from RapidAPI.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {hasExistingKey ? 'Update RapidAPI Key' : 'RapidAPI Key'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasExistingKey ? "Enter new API key to update" : "Enter your RapidAPI key"}
              className="bg-editor border-editor-border"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-editor-text-muted">
              Get your free API key:
            </p>
            <ol className="text-sm text-editor-text-muted list-decimal list-inside space-y-1">
              <li>Visit RapidAPI and create an account</li>
              <li>Subscribe to Judge0 CE (free tier available)</li>
              <li>Copy your API key from the dashboard</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://rapidapi.com/judge0-official/api/judge0-ce', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open RapidAPI
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            
            {hasExistingKey && (
              <Button variant="outline" onClick={handleTest} className="flex-1">
                Test Key
              </Button>
            )}
            
            {hasExistingKey ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!apiKey.trim()}>
                  Update
                </Button>
                <Button variant="destructive" onClick={handleRemove}>
                  Remove
                </Button>
              </div>
            ) : (
              <Button onClick={handleSave} className="flex-1">
                Save Key
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySetup;
