
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface TerminalProps {
  output: string[];
  isRunning: boolean;
  onClear?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ output, isRunning, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);
  
  return (
    <div className="bg-editor-sidebar border border-editor-border rounded-md overflow-hidden h-full">
      <div className="bg-editor-border px-3 py-1.5 text-xs font-medium flex items-center justify-between">
        <span>Terminal Output</span>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Running...
            </span>
          )}
          {onClear && output.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 text-gray-400 hover:text-white hover:bg-transparent"
              onClick={onClear}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-32px)] p-3 font-mono text-sm">
        {output.length === 0 ? (
          <div className="text-editor-text-muted italic">
            Run your code to see output here...
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {output.map((line, index) => (
              <div key={index} className="mb-1">{line}</div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Terminal;
