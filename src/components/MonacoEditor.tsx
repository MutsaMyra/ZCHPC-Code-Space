
import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { FileNode } from './FileExplorer';
import { Language, languages } from './LanguageSelector';

interface MonacoEditorProps {
  file: FileNode | null;
  language: string;
  onChange: (value: string | undefined) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ file, language, onChange }) => {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Focus the editor
    editor.focus();
    
    // Set up window resize listener for responsiveness
    const handleResize = () => {
      if (editor) {
        editor.layout();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial layout adjustment
    setTimeout(() => {
      handleResize();
    }, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };
  
  // Make sure the editor resizes when its container resizes
  useEffect(() => {
    if (!editorRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Map file extension to Monaco language identifier
  const getMonacoLanguage = () => {
    const lang = languages.find(l => l.id === language);
    
    switch(lang?.id) {
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'php': return 'php';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      default: return 'plaintext';
    }
  };

  // Generate appropriate sample code based on language
  const getSampleCode = () => {
    switch(language) {
      case 'javascript':
        return `// React component example
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`;
      
      case 'python':
        return `# Jupyter Notebook-style code
import matplotlib.pyplot as plt
import numpy as np

# Generate data for plotting
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create a plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', label='sin(x)')
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.legend()
plt.show()`;
      
      case 'php':
        return `<?php

namespace App\\Http\\Controllers;

use App\\Models\\User;
use Illuminate\\Http\\Request;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     *
     * @return \\Illuminate\\Http\\Response
     */
    public function index()
    {
        $users = User::all();
        
        return view('users.index', compact('users'));
    }
    
    /**
     * Store a newly created user.
     *
     * @param  \\Illuminate\\Http\\Request  $request
     * @return \\Illuminate\\Http\\Response
     */
    public function store(Request $request)
    {
        $user = User::create($request->validated());
        
        return redirect()->route('users.show', $user);
    }
}`;
      
      case 'cpp':
        return `#include <iostream>
#include <vector>
#include <algorithm>

// A simple C++ program demonstrating vector usage
int main() {
    // Create a vector of integers
    std::vector<int> numbers = {5, 2, 8, 1, 9, 3};
    
    // Sort the vector
    std::sort(numbers.begin(), numbers.end());
    
    // Print the sorted vector
    std::cout << "Sorted numbers: ";
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Calculate sum using algorithm
    int sum = 0;
    for_each(numbers.begin(), numbers.end(), [&sum](int n) {
        sum += n;
    });
    
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}`;
      
      case 'java':
        return `package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@RestController
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public String hello(@RequestParam(value = "name", defaultValue = "World") String name) {
        return String.format("Hello, %s!", name);
    }
    
    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        // Save user to database
        return user;
    }
    
    static class User {
        private Long id;
        private String name;
        private String email;
        
        // Getters and setters
    }
}`;
      
      default:
        return '// Select a language to start coding';
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full flex-1 overflow-hidden">
      <Editor
        height="100%"
        theme="vs-dark"
        language={getMonacoLanguage()}
        value={file?.content || getSampleCode()}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          lineHeight: 21,
          automaticLayout: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
          },
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
