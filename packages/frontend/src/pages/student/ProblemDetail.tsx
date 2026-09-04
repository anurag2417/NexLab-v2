import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Loader2, Zap, Copy, Check, 
  Lightbulb, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, Clock, AlertCircle, Terminal,
  ChevronRight, ChevronLeft, Settings
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
  acceptanceRate?: number;
  totalSubmissions?: number;
}

interface TestResult {
  input: string;
  expected: string;
  got: string;
  passed: boolean;
  isHidden: boolean;
}

interface SubmissionResult {
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  testResults?: TestResult[];
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
  const [showDescription, setShowDescription] = useState(true);
  const [selectedTestCase, setSelectedTestCase] = useState<number>(0);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Configure Monaco
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
      fetchSubmissions();
    }
  }, [slug]);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data.problem);
      
      let starterCode = `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var sumOfTwoNumbers = function(a, b) {
    // Write your solution here
    return 0;
};`;
      
      if (data.problem.starterCode) {
        starterCode = data.problem.starterCode;
      }
      
      setCode(starterCode);
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/problems/submissions');
      setSubmissions(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSubmissions([]);
      }
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: []
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const response = await api.post(`/problems/${slug}/submit`, {
        code: code,
      });
      
      const data = response.data.data;
      setResult({
        ...data,
        testResults: data.testResults || []
      });
      
      await fetchSubmissions();
      
      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error: any) {
      console.error('Error running code:', error);
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: error.response?.data?.message || 'Failed to execute code',
        testResults: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: []
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await api.post(`/problems/${slug}/submit`, {
        code: code,
      });

      const data = response.data.data;
      setResult({
        ...data,
        testResults: data.testResults || []
      });
      
      await fetchSubmissions();
      
      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: error.response?.data?.message || 'Failed to submit',
        testResults: []
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    setShowSettings(false);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-[#10B981]',
      medium: 'text-[#FBBF24]',
      hard: 'text-[#F87171]',
    };
    return colors[difficulty] || 'text-[#5C6360]';
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

  const visibleTestCases = problem?.testCases?.filter((t: any) => !t.isHidden) || [];

  const getTestCaseResult = (index: number) => {
    if (!result?.testResults) return null;
    const visibleResults = result.testResults.filter((r: TestResult) => !r.isHidden);
    return visibleResults[index] || null;
  };

  const getPassedVisibleCount = () => {
    if (!result?.testResults) return 0;
    const visibleResults = result.testResults.filter((r: TestResult) => !r.isHidden);
    return visibleResults.filter((r: TestResult) => r.passed).length;
  };

  const getTotalVisibleCount = () => {
    return visibleTestCases.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0F0F]">
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
    <div className="h-screen flex flex-col bg-[#0D0F0F] overflow-hidden">
      <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#EDEFEE]">{problem.title}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={getDifficultyBadge(problem.difficulty)}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </span>
              <span className="text-[#5C6360]">•</span>
              <span className="text-[#5C6360]">{problem.tags?.join(', ') || 'General'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-1 text-xs h-8">
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1 text-xs h-8">
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className={`${showDescription ? 'w-1/2' : 'w-0'} flex flex-col bg-[#0D0F0F] border-r border-[#2A302E] transition-all duration-300 overflow-hidden min-h-0`}>
          <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#EDEFEE]">Description</span>
              <button onClick={() => setShowHints(!showHints)} className="text-xs text-[#5C6360] hover:text-[#EDEFEE] transition-colors flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Hints
              </button>
            </div>
            <button onClick={() => setShowDescription(false)} className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-xs text-[#5C6360] pb-4 border-b border-[#2A302E]">
                <span>Acceptance Rate: <span className="text-[#EDEFEE]">{(problem.acceptanceRate || 45.6)}%</span></span>
                <span>•</span>
                <span>Submissions: <span className="text-[#EDEFEE]">{problem.totalSubmissions || 1284}</span></span>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Problem</h2>
                <div className="text-[#9CA3A0] whitespace-pre-wrap leading-relaxed text-sm">{problem.description}</div>
              </div>

              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Examples</h2>
                  {problem.examples.map((example, index) => (
                    <div key={index} className="bg-[#1A1D1E] border border-[#2A302E] rounded-lg p-4 mb-3">
                      <div className="mb-2">
                        <span className="text-xs text-[#5C6360]">Input:</span>
                        <pre className="text-sm text-[#EDEFEE] bg-[#0D0F0F] p-2 rounded mt-1 font-mono">{example.input}</pre>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-[#5C6360]">Output:</span>
                        <pre className="text-sm text-[#10B981] bg-[#0D0F0F] p-2 rounded mt-1 font-mono">{example.output}</pre>
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
          </div>
        </div>

        <div className={`${showDescription ? 'w-1/2' : 'w-full'} flex flex-col bg-[#0D0F0F] min-h-0`}>
          <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDescription(true)} className={`text-[#5C6360] hover:text-[#EDEFEE] transition-colors ${showDescription ? 'hidden' : ''}`}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#9CA3A0]">JavaScript</span>
              <span className="text-xs text-[#5C6360]">• {problem.timeLimit || 2000}ms • {problem.memoryLimit || 256}MB</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyCode} className="text-[#5C6360] hover:text-[#EDEFEE] p-1 rounded hover:bg-[#1E2322] transition-colors" title="Copy code">
                {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className="text-[#5C6360] hover:text-[#EDEFEE] p-1 rounded hover:bg-[#1E2322] transition-colors" title="Settings">
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-[#1A1D1E] border-b border-[#2A302E] p-3 flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-[#5C6360]">Font Size:</span>
              <button onClick={() => handleFontSizeChange(12)} className={`text-xs px-2 py-1 rounded ${fontSize === 12 ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}>12</button>
              <button onClick={() => handleFontSizeChange(14)} className={`text-xs px-2 py-1 rounded ${fontSize === 14 ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}>14</button>
              <button onClick={() => handleFontSizeChange(16)} className={`text-xs px-2 py-1 rounded ${fontSize === 16 ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}>16</button>
              <button onClick={() => handleFontSizeChange(18)} className={`text-xs px-2 py-1 rounded ${fontSize === 18 ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}>18</button>
              <button onClick={() => handleFontSizeChange(20)} className={`text-xs px-2 py-1 rounded ${fontSize === 20 ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}>20</button>
            </div>
          )}

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
                fontSize: fontSize,
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

          <div className="border-t border-[#2A302E] bg-[#1A1D1E] flex-shrink-0" style={{ height: '45%' }}>
            <div className="flex border-b border-[#2A302E] bg-[#0D0F0F]">
              <button onClick={() => setActiveTab('description')} className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 ${activeTab === 'description' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'}`}>Test Cases</button>
              <button onClick={() => setActiveTab('submissions')} className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 ${activeTab === 'submissions' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'}`}>Submissions ({submissions.length})</button>
              {result && <button className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 border-[#10B981] text-[#10B981]`}>Results</button>}
            </div>

            <div className="h-[calc(100%-32px)] overflow-y-auto p-4">
              {activeTab === 'description' ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#5C6360]">Test Cases</span>
                    {result && <span className="text-xs text-[#5C6360]">{getPassedVisibleCount()} / {getTotalVisibleCount()} visible tests passed</span>}
                  </div>
                  {visibleTestCases.length === 0 ? (
                    <p className="text-sm text-[#5C6360]">No test cases available</p>
                  ) : (
                    <div className="space-y-2">
                      {visibleTestCases.map((testCase: any, index: number) => {
                        const testResult = getTestCaseResult(index);
                        const passed = testResult?.passed;
                        const hasResult = testResult !== null;
                        
                        return (
                          <div key={index} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTestCase === index ? 'bg-[#10B981]/10 border border-[#10B981]/30' : 'hover:bg-[#1E2322]'} ${hasResult ? (passed ? 'border-l-4 border-l-[#10B981]' : 'border-l-4 border-l-[#F87171]') : ''}`} onClick={() => setSelectedTestCase(index)}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#9CA3A0]">Case {index + 1}</span>
                              {hasResult ? (passed ? <CheckCircle className="w-4 h-4 text-[#10B981]" /> : <XCircle className="w-4 h-4 text-[#F87171]" />) : <span className="text-xs text-[#5C6360]">⏳</span>}
                            </div>
                            <div className="text-xs text-[#5C6360] mt-1 truncate">Input: {testCase.input.substring(0, 50)}...</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeTab === 'submissions' ? (
                <div>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-[#5C6360] italic">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.slice(0, 10).map((sub, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#1A1D1E] border border-[#2A302E] rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(sub.status)}
                            <span className={`text-sm font-medium ${getStatusColor(sub.status)}`}>{sub.status === 'accepted' ? 'Accepted' : sub.status.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#5C6360]">
                            <span>Runtime: {sub.runtime || 0}ms</span>
                            <span>Memory: {sub.memory || 0}MB</span>
                            <span>{new Date(sub.createdAt || sub.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};