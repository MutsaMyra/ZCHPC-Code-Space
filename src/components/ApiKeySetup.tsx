
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeySetupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    // Store in localStorage for now (in a real app, this should be in environment variables)
    localStorage.setItem('judge0_api_key', apiKey);
    toast.success('API key saved successfully');
    onClose();
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
          <Alert>
            <AlertDescription>
              To enable real code execution, you need a Judge0 API key from RapidAPI.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">RapidAPI Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your RapidAPI key"
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
            <Button onClick={handleSave} className="flex-1">
              Save Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySetup;
