import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, Terminal, ChevronDown, X, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

// Monaco Editor is heavy - we'll dynamically import it
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

interface Language {
  id: string;
  name: string;
  extension: string;
  defaultVersion: string;
  sample: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executed: boolean;
  exitCode?: number;
  language?: string;
  version?: string;
  executionTime?: string;
  isCompileError?: boolean;
  message?: string; // Added for error messages
}

export const Sandbox: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/sandbox/languages');
      const data = response.data.data;
      setLanguages(data);
      if (data.length > 0) {
        setSelectedLanguage(data[0].id);
        setCode(data[0].sample);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (languageId: string) => {
    const lang = languages.find(l => l.id === languageId);
    if (lang) {
      setSelectedLanguage(languageId);
      setCode(lang.sample);
      setResult(null);
    }
    setIsLanguageDropdownOpen(false);
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please write some code first.');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await api.post('/sandbox/execute', {
        language: selectedLanguage,
        code: code,
        stdin: stdin,
      });

      setResult(response.data);
      
      // Scroll to output
      if (outputRef.current) {
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      setResult({
        success: false,
        output: '',
        error: error.response?.data?.message || 'Failed to execute code.',
        executed: false,
        message: error.response?.data?.message || 'Failed to execute code.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyOutput = () => {
    const text = result?.output || result?.error || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  const getLanguageColor = (languageId: string) => {
    const colors: Record<string, string> = {
      python: 'bg-blue-500',
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-600',
      java: 'bg-red-500',
      cpp: 'bg-purple-500',
      c: 'bg-gray-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-500',
      ruby: 'bg-red-600',
      php: 'bg-indigo-500',
      swift: 'bg-orange-600',
      kotlin: 'bg-purple-600',
    };
    return colors[languageId] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const currentLanguage = languages.find(l => l.id === selectedLanguage);

  return (
    <div className="py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Code Sandbox</h1>
          <p className="text-text-body mt-1">Write, test, and run code in multiple languages</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-background-light border border-border rounded-lg hover:border-primary-300 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
              <span className="font-medium">{currentLanguage?.name || 'Select Language'}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-background-light border border-border rounded-lg shadow-lg py-1 z-10 max-h-60 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-background-muted transition-colors flex items-center gap-2 ${
                      selectedLanguage === lang.id ? 'bg-primary-50 text-primary-600' : ''
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getLanguageColor(lang.id)}`} />
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Run Button */}
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="bg-background-light border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
              <span className="text-sm font-medium text-text-heading">
                {currentLanguage?.name || 'Code Editor'}
              </span>
              <span className="text-xs text-text-muted">.{(currentLanguage?.extension || 'txt')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>⌘ + Enter to run</span>
            </div>
          </div>

          <div className="h-[400px] md:h-[500px]">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
                </div>
              }
            >
              <MonacoEditor
                language={selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                }}
              />
            </React.Suspense>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4">
          {/* Input */}
          <div className="bg-background-light border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-text-heading">Standard Input (stdin)</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full px-4 py-3 bg-background-light text-text-body text-sm font-mono focus:outline-none resize-none h-20"
            />
          </div>

          {/* Output */}
          <div className="bg-background-light border border-border rounded-xl overflow-hidden shadow-sm flex-1">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-heading">Output</span>
                {result && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.success ? 'bg-success-100 text-success-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result.success ? 'Success' : 'Error'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {result && (
                  <>
                    <button
                      onClick={handleCopyOutput}
                      className="p-1 text-text-muted hover:text-text-heading transition-colors"
                      title="Copy output"
                    >
                      {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleClearOutput}
                      className="p-1 text-text-muted hover:text-text-heading transition-colors"
                      title="Clear output"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div ref={outputRef} className="p-4 h-[180px] overflow-y-auto font-mono text-sm bg-background-muted">
              {!result && (
                <p className="text-text-muted italic">Run your code to see output here...</p>
              )}

              {result && (
                <div>
                  {/* stdout */}
                  {result.output && (
                    <div>
                      <div className="text-xs text-text-muted mb-1">STDOUT:</div>
                      <pre className="text-text-body whitespace-pre-wrap">{result.output}</pre>
                    </div>
                  )}

                  {/* stderr */}
                  {result.error && (
                    <div className="mt-2">
                      <div className="text-xs text-red-500 mb-1">STDERR:</div>
                      <pre className="text-red-600 whitespace-pre-wrap">{result.error}</pre>
                    </div>
                  )}

                  {/* Error message */}
                  {!result.success && result.message && (
                    <div className="mt-2">
                      <div className="text-xs text-red-500 mb-1">Error:</div>
                      <pre className="text-red-600 whitespace-pre-wrap">{result.message}</pre>
                    </div>
                  )}

                  {/* Execution info */}
                  {result.executed && result.success && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-text-muted">
                      {result.exitCode !== undefined && (
                        <span>Exit Code: {result.exitCode}</span>
                      )}
                      {result.executionTime && (
                        <span>Time: {result.executionTime}</span>
                      )}
                      {result.language && (
                        <span>Language: {result.language}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-4 text-xs text-text-muted text-center">
        <kbd className="px-2 py-1 bg-background-muted border border-border rounded text-xs">⌘ + Enter</kbd>
        {' '}to run code • Multiple languages supported • 10 executions per minute
      </div>
    </div>
  );
};