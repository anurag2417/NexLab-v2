import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Loader2, Zap, Copy, Check, 
  Lightbulb, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, Clock, AlertCircle, Terminal
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import Editor from '@monaco-editor/react';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: any[];
  constraints: string[];
  testCases: any[];
  starterCode: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
}

interface SubmissionResult {
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
}

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'testcases'>('description');

  // ✅ Configure Monaco on mount
  useEffect(() => {
    // @ts-ignore
    window.MonacoEnvironment = {
      getWorkerUrl: function (moduleId: string, label: string) {
        if (label === 'javascript' || label === 'typescript') {
          return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js';
        }
        return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js';
      }
    };
  }, []);

  useEffect(() => {
    if (slug) {
      fetchProblem();
    }
  }, [slug]);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data.problem);
      
      // ✅ CLEAN STARTER CODE - NO HTML
      let starterCode = `/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @return {number}
 */
var addThreeNumbers = function(a, b, c) {
    // Write your solution here
    return 0;
};`;
      
      // Use problem's starter code if available
      if (data.problem.starterCode) {
        if (typeof data.problem.starterCode === 'string') {
          starterCode = data.problem.starterCode;
        } else if (typeof data.problem.starterCode === 'object') {
          starterCode = data.problem.starterCode['javascript'] || 
                       data.problem.starterCode['js'] || 
                       starterCode;
        }
      }
      
      setCode(starterCode);
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      alert('Please write your solution first.');
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const response = await api.post(`/problems/${slug}/submit`, {
        language: 'javascript',
        code: code,
      });
      
      const data = response.data.data;
      setResult(data);
      
      if (data.status === 'accepted') {
        alert('✅ All test cases passed!');
      } else {
        alert(`❌ ${data.status.replace('_', ' ').toUpperCase()}`);
      }
    } catch (error: any) {
      console.error('Error running code:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to execute'));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write your solution first.');
      return;
    }

    if (!confirm('Submit your solution for full evaluation?')) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await api.post(`/problems/${slug}/submit`, {
        language: 'javascript',
        code: code,
      });

      const data = response.data.data;
      setResult(data);
      
      if (data.status === 'accepted') {
        alert('🎉 All test cases passed! Great job!');
      } else {
        alert(`❌ ${data.status.replace('_', ' ').toUpperCase()}`);
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-[#10B981] text-white',
      medium: 'bg-[#FBBF24] text-black',
      hard: 'bg-[#F87171] text-white',
    };
    return colors[difficulty] || 'bg-[#5C6360] text-white';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      accepted: <CheckCircle className="w-5 h-5 text-[#10B981]" />,
      wrong_answer: <XCircle className="w-5 h-5 text-[#F87171]" />,
      time_limit: <Clock className="w-5 h-5 text-[#FBBF24]" />,
      memory_limit: <AlertCircle className="w-5 h-5 text-[#FBBF24]" />,
      runtime_error: <XCircle className="w-5 h-5 text-[#F87171]" />,
      compile_error: <XCircle className="w-5 h-5 text-[#F87171]" />,
    };
    return icons[status] || <AlertCircle className="w-5 h-5 text-[#5C6360]" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'text-[#10B981]';
    if (status === 'wrong_answer' || status === 'runtime_error' || status === 'compile_error') return 'text-[#F87171]';
    return 'text-[#FBBF24]';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      accepted: 'Accepted ✅',
      wrong_answer: 'Wrong Answer ❌',
      time_limit: 'Time Limit Exceeded ⏱️',
      memory_limit: 'Memory Limit Exceeded 💾',
      runtime_error: 'Runtime Error 💥',
      compile_error: 'Compile Error 🔧',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0D0F0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-12 bg-[#0D0F0F]">
        <p className="text-[#9CA3A0]">Problem not found</p>
        <Button variant="primary" onClick={() => navigate('/problems')} className="mt-4">
          Back to Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D0F0F]">
      {/* Top Bar */}
      <div className="bg-[#161A19] border-b border-[#2A302E] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#EDEFEE]">{problem.title}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </span>
              <span className="text-[#5C6360]">•</span>
              <span className="text-[#5C6360]">{problem.tags?.join(', ') || 'General'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-1">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        {/* Left Panel - Problem Description */}
        <div className="flex flex-col bg-[#0D0F0F] border-r border-[#2A302E] min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-[#2A302E] bg-[#161A19] flex-shrink-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'description'
                  ? 'border-[#10B981] text-[#10B981]'
                  : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'testcases'
                  ? 'border-[#10B981] text-[#10B981]'
                  : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
              }`}
            >
              Test Cases
            </button>
            {problem.hints && problem.hints.length > 0 && (
              <button
                onClick={() => setShowHints(!showHints)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-1 ${
                  showHints
                    ? 'border-[#10B981] text-[#10B981]'
                    : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Hints
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Description</h2>
                  <div className="text-[#9CA3A0] whitespace-pre-wrap leading-relaxed">
                    {problem.description}
                  </div>
                </div>

                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Examples</h2>
                    {problem.examples.map((example, index) => (
                      <div key={index} className="bg-[#161A19] border border-[#2A302E] rounded-lg p-4 mb-3">
                        <div className="mb-2">
                          <span className="text-xs text-[#5C6360]">Input:</span>
                          <pre className="text-sm text-[#EDEFEE] bg-[#0D0F0F] p-2 rounded mt-1 font-mono">
                            {example.input}
                          </pre>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-[#5C6360]">Output:</span>
                          <pre className="text-sm text-[#10B981] bg-[#0D0F0F] p-2 rounded mt-1 font-mono">
                            {example.output}
                          </pre>
                        </div>
                        {example.explanation && (
                          <div>
                            <span className="text-xs text-[#5C6360]">Explanation:</span>
                            <p className="text-sm text-[#9CA3A0] mt-1">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Constraints</h2>
                    <ul className="space-y-1 text-sm text-[#9CA3A0]">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index} className="list-disc list-inside">• {constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {showHints && problem.hints && problem.hints.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Hints</h2>
                    <div className="space-y-2">
                      {problem.hints.map((hint, index) => (
                        <div key={index} className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg p-3 text-sm text-[#9CA3A0]">
                          💡 {hint}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'testcases' && (
              <div>
                <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Test Cases</h2>
                <div className="space-y-3">
                  {problem.testCases && problem.testCases.filter((t: any) => !t.isHidden).length > 0 ? (
                    problem.testCases.filter((t: any) => !t.isHidden).map((testCase: any, index: number) => (
                      <div key={index} className="bg-[#161A19] border border-[#2A302E] rounded-lg p-3">
                        <div className="text-xs text-[#5C6360] mb-1">Test Case {index + 1}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-[#5C6360]">Input:</span>
                            <pre className="text-[#EDEFEE] bg-[#0D0F0F] p-2 rounded mt-1 font-mono text-xs">
                              {testCase.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-xs text-[#5C6360]">Expected:</span>
                            <pre className="text-[#10B981] bg-[#0D0F0F] p-2 rounded mt-1 font-mono text-xs">
                              {testCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#5C6360] text-sm">No test cases available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Monaco Editor with Larger Font */}
        <div className="flex flex-col min-h-0 bg-[#0D0F0F]">
          <div className="bg-[#161A19] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5C6360]" />
              <span className="text-sm text-[#9CA3A0]">JavaScript</span>
              <span className="text-xs text-[#5C6360]">• {problem.timeLimit || 2000}ms • {problem.memoryLimit || 256}MB</span>
            </div>
            <button 
              onClick={handleCopyCode} 
              className="text-[#5C6360] hover:text-[#EDEFEE] p-1.5 rounded hover:bg-[#1E2322] transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* ✅ MONACO EDITOR WITH LARGER FONT SIZE */}
          <div className="flex-1 min-h-0 bg-[#1E1E1E]">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language="javascript"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 18,
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: 'on',
                renderWhitespace: 'selection',
              }}
            />
          </div>

          {/* Result Panel */}
          {result && (
            <div className="bg-[#161A19] border-t border-[#2A302E] p-4 max-h-48 overflow-y-auto flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className={`font-medium ${getStatusColor(result.status)}`}>
                    {getStatusText(result.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#5C6360]">
                  {result.runtime !== undefined && <span>Runtime: {result.runtime}ms</span>}
                  <span>Tests: {result.passedTests}/{result.totalTests} passed</span>
                </div>
              </div>
              {result.errorMessage && (
                <pre className="text-sm text-[#F87171] bg-[#0D0F0F] p-3 rounded mt-2 font-mono whitespace-pre-wrap">
                  {result.errorMessage}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};