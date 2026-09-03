import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, Terminal, ChevronDown, X, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

interface Language {
  id: string;
  name: string;
  extension: string;
  sample: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executed: boolean;
  exitCode?: number;
  language?: string;
  executionTime?: string;
  message?: string;
}

export const Sandbox: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript'); // ✅ Changed to JavaScript
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
        // ✅ Set JavaScript as default when languages load
        const defaultLang = data.find(l => l.id === 'javascript') || data[0];
        setSelectedLanguage(defaultLang.id);
        setCode(defaultLang.sample);
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
      python: 'bg-[#10B981]',
      javascript: 'bg-[#FBBF24]',
      java: 'bg-[#F87171]',
      cpp: 'bg-[#60A5FA]',
    };
    return colors[languageId] || 'bg-[#10B981]';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  const currentLanguage = languages.find(l => l.id === selectedLanguage);

  return (
    <div className="py-8 max-w-full px-4 md:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#EDEFEE]">Code Sandbox</h1>
          <p className="text-[#9CA3A0] mt-1">Write, test, and run code in Python, JavaScript, Java, and C++</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg hover:border-[#10B981]/30 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
              <span className="font-medium text-[#EDEFEE]">{currentLanguage?.name || 'Select Language'}</span>
              <ChevronDown className={`w-4 h-4 text-[#9CA3A0] transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#161A19] border border-[#2A302E] rounded-lg shadow-lg py-1 z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#1E2322] transition-colors flex items-center gap-2 ${
                      selectedLanguage === lang.id ? 'bg-[#10B981]/10 text-[#10B981]' : 'text-[#9CA3A0]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getLanguageColor(lang.id)}`} />
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#2A302E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
              <span className="text-sm font-medium text-[#EDEFEE]">
                {currentLanguage?.name || 'Code Editor'}
              </span>
              <span className="text-xs text-[#5C6360]">.{(currentLanguage?.extension || 'txt')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5C6360]">
              <span>⌘ + Enter to run</span>
            </div>
          </div>

          <div className="h-[550px] md:h-[650px]">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#10B981] border-t-transparent" />
                </div>
              }
            >
              <MonacoEditor
                language={selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
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

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          {/* Standard Input */}
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm flex-1">
            <div className="px-4 py-3 border-b border-[#2A302E]">
              <span className="text-sm font-medium text-[#EDEFEE]">Standard Input (stdin)</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full px-4 py-3 bg-[#161A19] text-[#EDEFEE] text-sm font-mono focus:outline-none resize-none h-28"
            />
          </div>

          {/* Output */}
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm flex-[2]">
            <div className="px-4 py-3 border-b border-[#2A302E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#9CA3A0]" />
                <span className="text-sm font-medium text-[#EDEFEE]">Output</span>
                {result && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    result.success 
                      ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
                      : 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20'
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
                      className="p-1 text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
                      title="Copy output"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleClearOutput}
                      className="p-1 text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
                      title="Clear output"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div ref={outputRef} className="p-4 h-48 overflow-y-auto font-mono text-sm bg-[#0D0F0F]">
              {!result && (
                <p className="text-[#5C6360] italic">Run your code to see output here...</p>
              )}

              {result && (
                <div>
                  {result.output && (
                    <div>
                      <div className="text-xs text-[#9CA3A0] mb-1">STDOUT:</div>
                      <pre className="text-[#EDEFEE] whitespace-pre-wrap">{result.output}</pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2">
                      <div className="text-xs text-[#F87171] mb-1">STDERR:</div>
                      <pre className="text-[#F87171] whitespace-pre-wrap">{result.error}</pre>
                    </div>
                  )}

                  {!result.success && result.message && (
                    <div className="mt-2">
                      <div className="text-xs text-[#F87171] mb-1">Error:</div>
                      <pre className="text-[#F87171] whitespace-pre-wrap">{result.message}</pre>
                    </div>
                  )}

                  {result.executed && result.success && (
                    <div className="mt-3 pt-3 border-t border-[#2A302E] flex items-center gap-4 text-xs text-[#9CA3A0]">
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

      {/* Footer */}
      <div className="mt-4 text-xs text-[#5C6360] text-center">
        <kbd className="px-2.5 py-1 bg-[#161A19] border border-[#2A302E] rounded text-xs">⌘ + Enter</kbd>
        {' '}to run code • 4 languages supported • 5 executions per minute
      </div>
    </div>
  );
};