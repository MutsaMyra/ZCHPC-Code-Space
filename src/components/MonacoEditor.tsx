
import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileNode } from './FileExplorer';

interface MonacoEditorProps {
  file: FileNode;
  language: string;
  onChange?: (value: string | undefined) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ file, language, onChange }) => {
  const editorRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    setIsReady(true);

    // Fix cursor position accuracy
    editor.updateOptions({
      cursorSmoothCaretAnimation: false,
      cursorBlinking: 'blink',
      cursorStyle: 'line',
      cursorWidth: 2,
      smoothScrolling: false,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      }
    });

    // Ensure proper focus and cursor positioning
    editor.onDidChangeCursorPosition((e: any) => {
      if (e.source === 'mouse' || e.source === 'keyboard') {
        editor.revealPositionInCenter(e.position);
      }
    });

    // Fix text selection accuracy
    editor.onDidChangeCursorSelection((e: any) => {
      if (e.source === 'mouse') {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          editor.revealRangeInCenter(selection);
        }
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  // Set cursor to end of file when file changes
  useEffect(() => {
    if (isReady && editorRef.current && file) {
      const editor = editorRef.current;
      const model = editor.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        const lastLineLength = model.getLineLength(lineCount);
        const position = { lineNumber: lineCount, column: lastLineLength + 1 };
        editor.setPosition(position);
        editor.focus();
      }
    }
  }, [file.id, isReady]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={file.content || ''}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
