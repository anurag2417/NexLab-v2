// packages/frontend/src/pages/student/ProblemDetail.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Loader2, Zap, Copy, Check, 
  Lightbulb, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, Clock, AlertCircle, Terminal,
  ChevronRight, ChevronLeft, Settings, Maximize2, Minimize2,
  GripVertical, GripHorizontal, FileText, History, Layers, X
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import Editor from '@monaco-editor/react';

// Import components
import { StatusBar } from '../../components/StatusBar';
import { TestCaseConsole } from '../../components/TestCaseConsole';
import { SubmissionHistory } from '../../components/SubmissionHistory';
import { CodeHistory } from '../../components/CodeHistory';

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
  runtime: number;
  memory: number;
  error: string | null;
}

interface SubmissionResult {
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  testResults?: TestResult[];
  isSubmission?: boolean;
  submission?: {
    id: string;
    status: string;
    passedTests: number;
    totalTests: number;
    runtime: number;
    memory: number;
    errorMessage: string;
    createdAt: string;
  };
}

interface Submission {
  _id: string;
  problemId: {
    _id: string;
    title: string;
    difficulty: string;
  } | string;
  userId: string;
  language: string;
  code: string;
  status: string;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  createdAt: string;
  submittedAt: string;
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
  const [activeTab, setActiveTab] = useState<'testcases' | 'submissions' | 'history' | 'results'>('testcases');
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  
  // Split view states
  const [splitPosition, setSplitPosition] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const verticalDragRef = useRef<HTMLDivElement>(null);
  const horizontalDragRef = useRef<HTMLDivElement>(null);

  // ✅ Get problem-specific submissions
  const problemSubmissions = useMemo(() => {
    if (!problem) return [];
    return allSubmissions.filter((sub: Submission) => {
      const problemId = typeof sub.problemId === 'string' 
        ? sub.problemId 
        : sub.problemId?._id;
      return problemId === problem._id;
    });
  }, [allSubmissions, problem]);

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
      loadCodeHistory();
    }
  }, [slug]);

  // Auto-save code to localStorage
  useEffect(() => {
    if (code && slug) {
      const timer = setTimeout(() => {
        localStorage.setItem(`code_${slug}`, code);
        saveCodeHistory(code);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, slug]);

  // Switch to results tab when submission result is received
  useEffect(() => {
    if (result && result.testResults && result.testResults.length > 0 && result.isSubmission) {
      setActiveTab('results');
    }
  }, [result]);

  // Vertical Drag Handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      
      let percentage = (mouseY / containerHeight) * 100;
      percentage = Math.max(20, Math.min(80, percentage));
      
      setSplitPosition(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const touchY = e.touches[0].clientY - containerRect.top;
      
      let percentage = (touchY / containerHeight) * 100;
      percentage = Math.max(20, Math.min(80, percentage));
      
      setSplitPosition(percentage);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging]);

  // Horizontal Drag Handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingHorizontal || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const mouseX = e.clientX - containerRef.current.getBoundingClientRect().left;
      
      let percentage = (mouseX / containerWidth) * 100;
      percentage = Math.max(15, Math.min(60, percentage));
      
      setLeftWidth(percentage);
    };

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'none';
    };

    if (isDraggingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDraggingHorizontal]);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data.problem);
      
      const savedCode = localStorage.getItem(`code_${slug}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
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
      }
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
      setAllSubmissions(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setAllSubmissions([]);
      }
    }
  };

  const loadCodeHistory = () => {
    const history = localStorage.getItem(`code_history_${slug}`);
    if (history) {
      try {
        setCodeHistory(JSON.parse(history));
      } catch (e) {
        setCodeHistory([]);
      }
    }
  };

  const saveCodeHistory = (newCode: string) => {
    const lastCode = codeHistory[codeHistory.length - 1];
    if (lastCode === newCode) return;
    
    const updatedHistory = [...codeHistory, newCode];
    if (updatedHistory.length > 20) {
      updatedHistory.shift();
    }
    setCodeHistory(updatedHistory);
    localStorage.setItem(`code_history_${slug}`, JSON.stringify(updatedHistory));
  };

  // ✅ UPDATED: Run code (does NOT count as submission)
  const handleRunCode = async () => {
    if (!code.trim()) {
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: [],
        isSubmission: false,
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      // ✅ Pass isSubmission: false for Run
      const response = await api.post(`/problems/${slug}/submit`, {
        code: code,
        isSubmission: false,
      });
      
      const data = response.data.data;
      setResult({
        ...data,
        testResults: data.testResults || [],
        isSubmission: false,
      });
      
      // ✅ Don't fetch submissions on run (no new submission created)
      
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
        testResults: [],
        isSubmission: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // ✅ UPDATED: Submit code (DOES count as submission)
  const handleSubmit = async () => {
    if (!code.trim()) {
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: [],
        isSubmission: true,
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      // ✅ Pass isSubmission: true for Submit
      const response = await api.post(`/problems/${slug}/submit`, {
        code: code,
        isSubmission: true,
      });

      const data = response.data.data;
      
      setResult({
        ...data,
        testResults: data.testResults || [],
        isSubmission: true,
      });
      
      // ✅ Only fetch submissions on actual submission
      await fetchSubmissions();
      
      setActiveTab('results');
      
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
        testResults: [],
        isSubmission: true,
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

  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
    setIsBottomPanelMaximized(false);
  };

  const toggleBottomPanelMaximize = () => {
    setIsBottomPanelMaximized(!isBottomPanelMaximized);
    setIsEditorMaximized(false);
  };

  const resetLayout = () => {
    setIsEditorMaximized(false);
    setIsBottomPanelMaximized(false);
    setSplitPosition(60);
    setLeftWidth(40);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, { text: string; bg: string; label: string }> = {
      easy: { text: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '🟢 Easy' },
      medium: { text: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10', label: '🟡 Medium' },
      hard: { text: 'text-[#F87171]', bg: 'bg-[#F87171]/10', label: '🔴 Hard' },
    };
    return colors[difficulty] || colors.easy;
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

  const difficultyInfo = getDifficultyBadge(problem?.difficulty || 'easy');

  // Calculate panel heights
  const editorHeight = isEditorMaximized ? 100 : isBottomPanelMaximized ? 0 : splitPosition;
  const bottomHeight = isBottomPanelMaximized ? 100 : isEditorMaximized ? 0 : 100 - splitPosition;

  // Check if results are available
  const hasResults = result && result.testResults && result.testResults.length > 0;
  const allVisiblePassed = Boolean(hasResults && getPassedVisibleCount() === getTotalVisibleCount());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[#0D0F0F]">
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
      {/* Top Navigation Bar */}
      <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#EDEFEE]">{problem.title}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={`${difficultyInfo.text} font-medium`}>
                {difficultyInfo.label}
              </span>
              <span className="text-[#5C6360]">•</span>
              <span className="text-[#5C6360]">{problem.tags?.join(', ') || 'General'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout Controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={toggleEditorMaximize}
              className={`p-1.5 rounded-lg transition-colors ${
                isEditorMaximized ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-[#5C6360] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
              }`}
              title="Maximize Editor"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleBottomPanelMaximize}
              className={`p-1.5 rounded-lg transition-colors ${
                isBottomPanelMaximized ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-[#5C6360] hover:text-[#EDEFEE] hover:bg-[#1E2322]'
              }`}
              title="Maximize Test Cases"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            {(isEditorMaximized || isBottomPanelMaximized) && (
              <button
                onClick={resetLayout}
                className="p-1.5 text-[#5C6360] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
                title="Reset Layout"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* LEFT PANEL - Problem Description */}
        <div 
          className="flex flex-col bg-[#0D0F0F] min-h-0 overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-medium text-[#EDEFEE]">Description</span>
            <button onClick={() => setShowDescription(false)} className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Problem Statistics */}
              <div className="flex items-center gap-6 text-sm text-[#5C6360] pb-4 border-b border-[#2A302E]">
                <div>
                  <span className="font-medium text-[#EDEFEE]">{problem.acceptanceRate || 45.6}%</span>
                  <span className="ml-1">Acceptance</span>
                </div>
                <div>
                  <span className="font-medium text-[#EDEFEE]">{problem.totalSubmissions || 1284}</span>
                  <span className="ml-1">Submissions</span>
                </div>
                <div>
                  <span className={`font-medium ${difficultyInfo.text}`}>{problem.difficulty}</span>
                  <span className="ml-1">Difficulty</span>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Problem</h2>
                <div className="text-[#9CA3A0] whitespace-pre-wrap leading-relaxed text-sm">{problem.description}</div>
              </div>

              {/* Examples */}
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

              {/* Constraints */}
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

              {/* Related Topics/Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Related Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full bg-[#2A302E] text-[#9CA3A0] text-xs hover:bg-[#10B981]/20 hover:text-[#10B981] cursor-pointer transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hints */}
              {problem.hints && problem.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 text-sm font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hints
                    {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {problem.hints.map((hint, index) => (
                        <div key={index} className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg p-3 text-sm text-[#9CA3A0]">
                          💡 {hint}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Drag Handle */}
        <div 
          className="w-1 flex-shrink-0 bg-[#2A302E] hover:bg-[#10B981] cursor-col-resize transition-colors duration-150 relative group"
          onMouseDown={() => setIsDraggingHorizontal(true)}
          onTouchStart={() => setIsDraggingHorizontal(true)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-12 bg-[#5C6360] group-hover:bg-[#10B981] rounded-full transition-colors" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-[#10B981]" />
          </div>
        </div>

        {/* RIGHT PANEL - Editor + Test Cases */}
        <div 
          className="flex-1 flex flex-col bg-[#0D0F0F] min-h-0"
          style={{ width: `${100 - leftWidth - 0.5}%` }}
        >
          {/* EDITOR SECTION */}
          <div 
            className="flex flex-col bg-[#0D0F0F] min-h-0"
            style={{ 
              height: `${editorHeight}%`,
              display: editorHeight === 0 ? 'none' : 'flex',
            }}
          >
            {/* Editor Header */}
            <div className="bg-[#1A1D1E] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDescription(true)} className={`text-[#5C6360] hover:text-[#EDEFEE] transition-colors ${showDescription ? 'hidden' : ''}`}>
                  <ChevronRight className="w-4 h-4" />
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

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="bg-[#1A1D1E] border-b border-[#2A302E] p-3 flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-[#5C6360]">Font Size:</span>
                {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`text-xs px-2 py-1 rounded ${fontSize === size ? 'bg-[#10B981] text-white' : 'text-[#9CA3A0] hover:text-[#EDEFEE]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {/* Code Editor */}
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

            {/* Vertical Drag Handle */}
            {!isEditorMaximized && !isBottomPanelMaximized && (
              <div 
                ref={verticalDragRef}
                className="flex-shrink-0 h-1 bg-[#2A302E] hover:bg-[#10B981] cursor-row-resize transition-colors duration-150 relative group"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-0.5 w-12 bg-[#5C6360] group-hover:bg-[#10B981] rounded-full transition-colors" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripHorizontal className="w-4 h-4 text-[#10B981]" />
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL - Test Cases & Results */}
          <div 
            className="flex flex-col bg-[#1A1D1E] border-t border-[#2A302E] min-h-0"
            style={{ 
              height: `${bottomHeight}%`,
              display: bottomHeight === 0 ? 'none' : 'flex',
            }}
          >
            {/* Tabs */}
            <div className="flex border-b border-[#2A302E] bg-[#0D0F0F] flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('testcases')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'testcases' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Test Cases
                {hasResults && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    allVisiblePassed ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F87171]/20 text-[#F87171]'
                  }`}>
                    {getPassedVisibleCount()}/{getTotalVisibleCount()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'results' 
                    ? 'border-[#10B981] text-[#10B981]' 
                    : hasResults 
                      ? 'border-[#10B981]/30 text-[#10B981]/70 hover:text-[#EDEFEE]' 
                      : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Results
                {hasResults && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    allVisiblePassed ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F87171]/20 text-[#F87171]'
                  }`}>
                    {getPassedVisibleCount()}/{getTotalVisibleCount()}
                  </span>
                )}
                {!hasResults && (
                  <span className="ml-1 text-[#5C6360]">(Submit to see)</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'submissions' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Submissions ({problemSubmissions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Code History
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {activeTab === 'testcases' && (
                <TestCaseConsole
                  visibleTestCases={visibleTestCases}
                  result={result}
                  selectedTestCase={selectedTestCase}
                  setSelectedTestCase={setSelectedTestCase}
                  getPassedVisibleCount={getPassedVisibleCount}
                  getTotalVisibleCount={getTotalVisibleCount}
                  getTestCaseResult={getTestCaseResult}
                />
              )}

              {activeTab === 'results' && (
                <ResultsTab 
                  result={result}
                  visibleTestCases={visibleTestCases}
                  getTestCaseResult={getTestCaseResult}
                  getPassedVisibleCount={getPassedVisibleCount}
                  getTotalVisibleCount={getTotalVisibleCount}
                  allVisiblePassed={allVisiblePassed}
                />
              )}

              {activeTab === 'submissions' && (
                <SubmissionHistory 
                  submissions={problemSubmissions} 
                  getStatusIcon={getStatusIcon} 
                  getStatusColor={getStatusColor}
                  problemTitle={problem.title}
                />
              )}

              {activeTab === 'history' && (
                <CodeHistory codeHistory={codeHistory} onRestoreCode={setCode} />
              )}
            </div>
          </div>

          {/* Status Bar */}
          <StatusBar result={result} problem={problem} />
        </div>
      </div>
    </div>
  );
};

// ✅ Results Tab Component
const ResultsTab: React.FC<{
  result: SubmissionResult | null;
  visibleTestCases: any[];
  getTestCaseResult: (index: number) => any;
  getPassedVisibleCount: () => number;
  getTotalVisibleCount: () => number;
  allVisiblePassed: boolean;
}> = ({
  result,
  visibleTestCases,
  getTestCaseResult,
  getPassedVisibleCount,
  getTotalVisibleCount,
  allVisiblePassed,
}) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#5C6360]">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="font-medium text-[#9CA3A0]">No results yet</p>
        <p className="text-sm">Submit your solution to see detailed test results</p>
      </div>
    );
  }

  const passedCount = getPassedVisibleCount();
  const totalCount = getTotalVisibleCount();
  const hiddenCount = result.totalTests - totalCount;

  // Check if this was a submission or just a run
  const isSubmission = result.isSubmission !== false;

  return (
    <div className="space-y-4">
      {/* Submission/Run Badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          isSubmission 
            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' 
            : 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30'
        }`}>
          {isSubmission ? '📝 Submission' : '⚡ Run (Not Saved)'}
        </span>
        {!isSubmission && (
          <span className="text-xs text-[#5C6360]">
            Results from running code - not counted as submission
          </span>
        )}
      </div>

      {/* Summary Card */}
      <div className={`p-4 rounded-lg border ${
        allVisiblePassed && result.status === 'accepted'
          ? 'bg-[#10B981]/10 border-[#10B981]/30'
          : 'bg-[#F87171]/10 border-[#F87171]/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {allVisiblePassed && result.status === 'accepted' ? (
              <CheckCircle className="w-6 h-6 text-[#10B981]" />
            ) : (
              <XCircle className="w-6 h-6 text-[#F87171]" />
            )}
            <div>
              <h3 className="font-semibold text-[#EDEFEE]">
                {allVisiblePassed && result.status === 'accepted' ? '🎉 All Tests Passed!' : 'Some Tests Failed'}
              </h3>
              <p className="text-sm text-[#9CA3A0]">
                {passedCount} of {totalCount} visible tests passed
                {hiddenCount > 0 && ` • ${hiddenCount} hidden test(s)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <span className="block text-xs text-[#5C6360]">Runtime</span>
              <span className="font-medium text-[#EDEFEE]">{result.runtime || 0}ms</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-[#5C6360]">Memory</span>
              <span className="font-medium text-[#EDEFEE]">{result.memory || 0}MB</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-[#5C6360]">Status</span>
              <span className={`font-medium ${getStatusColor(result.status)}`}>
                {getStatusText(result.status)}
              </span>
            </div>
          </div>
        </div>
        {result.errorMessage && (
          <div className="mt-3 p-2 bg-[#0D0F0F] rounded-lg border border-[#F87171]/20">
            <span className="text-xs text-[#F87171]">Error:</span>
            <pre className="text-sm text-[#F87171] font-mono whitespace-pre-wrap break-all mt-1">
              {result.errorMessage}
            </pre>
          </div>
        )}
      </div>

      {/* Test Case Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5C6360] uppercase tracking-wider">Test Case Details</span>
          <span className="text-xs text-[#5C6360]">
            {passedCount}/{totalCount} passed
          </span>
        </div>

        {visibleTestCases.map((testCase, index) => {
          const testResult = getTestCaseResult(index);
          const passed = testResult?.passed || false;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                passed
                  ? 'border-[#10B981]/30 bg-[#10B981]/5'
                  : 'border-[#F87171]/30 bg-[#F87171]/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#F87171]" />
                  )}
                  <span className="text-sm font-medium text-[#EDEFEE]">
                    Test Case {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    passed
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#F87171]/20 text-[#F87171]'
                  }`}>
                    {passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                {testResult?.runtime !== undefined && (
                  <span className="text-xs text-[#5C6360]">{testResult.runtime}ms</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0D0F0F] rounded p-2">
                  <span className="text-[#5C6360]">Input:</span>
                  <pre className="text-[#EDEFEE] font-mono mt-0.5 whitespace-pre-wrap break-all">
                    {testCase.input}
                  </pre>
                </div>
                <div className="bg-[#0D0F0F] rounded p-2">
                  <span className="text-[#5C6360]">Expected:</span>
                  <pre className="text-[#10B981] font-mono mt-0.5 whitespace-pre-wrap break-all">
                    {testCase.expectedOutput}
                  </pre>
                </div>
                {testResult && (
                  <div className="bg-[#0D0F0F] rounded p-2 md:col-span-2">
                    <span className="text-[#5C6360]">Your Output:</span>
                    <pre className={`font-mono mt-0.5 whitespace-pre-wrap break-all ${
                      passed ? 'text-[#10B981]' : 'text-[#F87171]'
                    }`}>
                      {testResult.got || 'No output'}
                    </pre>
                  </div>
                )}
                {testResult?.error && (
                  <div className="bg-[#F87171]/10 rounded p-2 md:col-span-2 border border-[#F87171]/20">
                    <span className="text-[#F87171]">Error:</span>
                    <pre className="text-[#F87171] font-mono mt-0.5 whitespace-pre-wrap break-all">
                      {testResult.error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="p-3 bg-[#0D0F0F] rounded-lg border border-[#2A302E] text-center">
            <span className="text-xs text-[#5C6360]">
              🔒 {hiddenCount} hidden test case(s) not shown
              {result.status === 'accepted' && ' (All passed!)'}
              {result.status === 'wrong_answer' && passedCount === totalCount && ' (Some hidden tests failed)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Status helpers for ResultsTab
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

export default ProblemDetail;