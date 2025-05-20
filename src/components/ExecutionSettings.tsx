
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Cloud, Cpu, Sliders } from 'lucide-react';

export interface ExecutionConfig {
  mode: 'online' | 'offline';
  hardware: 'cpu' | 'gpu';
  cpuCores: number;
  gpuMemory: number;
  autoDetect: boolean;
  timeout: number;
}

interface ExecutionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExecutionConfig;
  onConfigChange: (config: ExecutionConfig) => void;
}

const ExecutionSettings: React.FC<ExecutionSettingsProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
}) => {
  const handleModeChange = (mode: 'online' | 'offline') => {
    onConfigChange({ ...config, mode });
  };

  const handleHardwareChange = (hardware: 'cpu' | 'gpu') => {
    onConfigChange({ ...config, hardware });
  };

  const handleAutoDetectChange = (checked: boolean) => {
    onConfigChange({ ...config, autoDetect: checked });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-editor sm:max-w-[500px] text-editor-text">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sliders className="mr-2 h-5 w-5" />
            Execution Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mode" className="mt-4">
          <TabsList className="bg-editor-sidebar">
            <TabsTrigger value="mode">Execution Mode</TabsTrigger>
            <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mode" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="auto-detect" className="flex items-center space-x-2">
                  <span>Auto-detect mode</span>
                </Label>
                <Switch
                  id="auto-detect"
                  checked={config.autoDetect}
                  onCheckedChange={handleAutoDetectChange}
                />
              </div>

              <RadioGroup
                value={config.mode}
                onValueChange={(value) => handleModeChange(value as 'online' | 'offline')}
                className="grid grid-cols-2 gap-4"
                disabled={config.autoDetect}
              >
                <div className={`flex flex-col items-center space-y-2 border rounded-md p-4 ${config.mode === 'online' ? 'bg-editor-highlight border-editor-active' : 'border-editor-border'}`}>
                  <RadioGroupItem value="online" id="online" className="sr-only" />
                  <Label htmlFor="online" className="cursor-pointer flex flex-col items-center space-y-2">
                    <Cloud className="h-6 w-6" />
                    <span className="font-medium">Online</span>
                    <span className="text-xs text-editor-text-muted text-center">
                      Execute code on remote servers with more resources
                    </span>
                  </Label>
                </div>

                <div className={`flex flex-col items-center space-y-2 border rounded-md p-4 ${config.mode === 'offline' ? 'bg-editor-highlight border-editor-active' : 'border-editor-border'}`}>
                  <RadioGroupItem value="offline" id="offline" className="sr-only" />
                  <Label htmlFor="offline" className="cursor-pointer flex flex-col items-center space-y-2">
                    <Cpu className="h-6 w-6" />
                    <span className="font-medium">Offline</span>
                    <span className="text-xs text-editor-text-muted text-center">
                      Execute code locally on your machine
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Hardware Type</Label>
                </div>
                <RadioGroup
                  value={config.hardware}
                  onValueChange={(value) => handleHardwareChange(value as 'cpu' | 'gpu')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className={`border rounded-md p-3 flex items-center space-x-2 ${config.hardware === 'cpu' ? 'bg-editor-highlight border-editor-active' : 'border-editor-border'}`}>
                    <RadioGroupItem value="cpu" id="cpu" />
                    <Label htmlFor="cpu">CPU</Label>
                  </div>
                  <div className={`border rounded-md p-3 flex items-center space-x-2 ${config.hardware === 'gpu' ? 'bg-editor-highlight border-editor-active' : 'border-editor-border'}`}>
                    <RadioGroupItem value="gpu" id="gpu" />
                    <Label htmlFor="gpu">GPU</Label>
                  </div>
                </RadioGroup>
              </div>

              {config.hardware === 'cpu' ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>CPU Cores: {config.cpuCores}</Label>
                  </div>
                  <Slider
                    value={[config.cpuCores]}
                    min={1}
                    max={16}
                    step={1}
                    onValueChange={([value]) => onConfigChange({ ...config, cpuCores: value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>GPU Memory: {config.gpuMemory} GB</Label>
                  </div>
                  <Slider
                    value={[config.gpuMemory]}
                    min={1}
                    max={16}
                    step={1}
                    onValueChange={([value]) => onConfigChange({ ...config, gpuMemory: value })}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Execution Timeout (seconds)</Label>
                <Input 
                  id="timeout" 
                  type="number" 
                  value={config.timeout} 
                  onChange={(e) => onConfigChange({ ...config, timeout: parseInt(e.target.value) || 30 })}
                  min={1}
                  max={300}
                  className="bg-editor-sidebar border-editor-border text-editor-text"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExecutionSettings;
