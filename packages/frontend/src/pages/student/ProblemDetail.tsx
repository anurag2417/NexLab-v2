import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Loader2, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, Copy, Check, Lightbulb, Save
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
  starterCode: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
}

interface SubmissionResult {
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  errorMessage?: string;
}

// Default starter code if none is provided
const DEFAULT_STARTER_CODE = `// Write your solution here
function solution() {
  // Your code goes here
  return 0;
}`;

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(DEFAULT_STARTER_CODE);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    if (slug) fetchProblem();
  }, [slug]);

  const fetchProblem = async () => {
  setLoading(true);
  try {
    console.log('📥 Fetching problem with slug:', slug);
    const response = await api.get(`/problems/${slug}`);
    console.log('📊 Problem response:', response.data);
    
    const data = response.data.data;
    setProblem(data.problem);
    
    // ✅ Get starter code from problem
    let starterCode = data.problem.starterCode;
    console.log('📝 Starter code from DB:', starterCode);
    
    // If starterCode is empty or not a string, generate one
    if (!starterCode || typeof starterCode !== 'string' || starterCode.trim() === '') {
      console.log('⚠️ No starter code found, generating from title');
      const functionName = data.problem.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      starterCode = `function ${functionName}() {\n  // Write your solution here\n  // Return the result\n  return 0;\n}`;
    }
    
    setCode(starterCode);
    
    // Count initial lines
    const lines = starterCode.split('\n').length;
    setLineCount(lines);
    
  } catch (error) {
    console.error('Error fetching problem:', error);
    navigate('/problems');
  } finally {
    setLoading(false);
  }
};

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    const lines = newCode.split('\n').length;
    setLineCount(lines);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      alert('Please write your solution first.');
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const response = await api.post(`/problems/${slug}/submit`, { code });
      setResult(response.data.data);
    } catch (error: any) {
      console.error('Run error:', error);
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        errorMessage: error.response?.data?.message || 'Execution failed',
      });
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
      const response = await api.post(`/problems/${slug}/submit`, { code });
      setResult(response.data.data);
      
      if (response.data.data.status === 'accepted') {
        alert('🎉 All test cases passed! Great job!');
      } else {
        alert(`❌ ${response.data.data.status.replace('_', ' ').toUpperCase()}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        errorMessage: error.response?.data?.message || 'Execution failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-[#10B981] bg-[#10B981]/10',
      medium: 'text-[#FBBF24] bg-[#FBBF24]/10',
      hard: 'text-[#F87171] bg-[#F87171]/10',
    };
    return colors[difficulty] || 'text-[#9CA3A0] bg-[#2A302E]';
  };

  const getStatusDisplay = () => {
    if (!result) return null;
    const statusMap: Record<string, { icon: JSX.Element; color: string; text: string }> = {
      accepted: { icon: <CheckCircle className="w-5 h-5 text-[#10B981]" />, color: 'text-[#10B981]', text: 'Accepted ✅' },
      wrong_answer: { icon: <XCircle className="w-5 h-5 text-[#F87171]" />, color: 'text-[#F87171]', text: 'Wrong Answer ❌' },
      time_limit: { icon: <XCircle className="w-5 h-5 text-[#FBBF24]" />, color: 'text-[#FBBF24]', text: 'Time Limit Exceeded ⏱️' },
      runtime_error: { icon: <XCircle className="w-5 h-5 text-[#F87171]" />, color: 'text-[#F87171]', text: 'Runtime Error 💥' },
    };
    return statusMap[result.status] || statusMap.runtime_error;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetCode = () => {
    const starterCode = problem?.starterCode || DEFAULT_STARTER_CODE;
    setCode(starterCode);
    const lines = starterCode.split('\n').length;
    setLineCount(lines);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <p className="text-[#9CA3A0]">Problem not found</p>
        <Button variant="primary" onClick={() => navigate('/problems')} className="mt-4">
          Back to Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F0F]">
      {/* Top Bar */}
      <div className="bg-[#161A19] border-b border-[#2A302E] px-4 py-3 flex items-center justify-between">
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-80px)]">
        {/* Left Panel - Problem Description */}
        <div className="overflow-y-auto p-6 border-r border-[#2A302E] bg-[#0D0F0F]">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Description</h2>
            <div className="text-[#9CA3A0] whitespace-pre-wrap leading-relaxed">
              {problem.description}
            </div>
          </div>

          <div className="mb-6">
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

          {problem.constraints.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-[#5C6360] uppercase tracking-wider mb-3">Constraints</h2>
              <ul className="space-y-1 text-sm text-[#9CA3A0]">
                {problem.constraints.map((constraint, index) => (
                  <li key={index} className="list-disc list-inside">• {constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {problem.hints.length > 0 && (
            <div className="mb-6">
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

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col bg-[#0D0F0F]">
          <div className="bg-[#161A19] border-b border-[#2A302E] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#EDEFEE]">JavaScript</span>
              <button
                onClick={handleResetCode}
                className="text-xs text-[#5C6360] hover:text-[#10B981] transition-colors"
              >
                Reset Code
              </button>
            </div>
            <button
              onClick={handleCopyCode}
              className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors p-1.5 rounded hover:bg-[#1E2322]"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Code Editor with Line Numbers */}
          <div className="flex-1 bg-[#1E1E1E] overflow-hidden">
            <div className="flex h-full">
              {/* Line Numbers */}
              <div className="bg-[#1E1E1E] text-[#858585] text-sm font-mono py-4 px-3 select-none text-right min-w-[40px] border-r border-[#2A302E]">
                {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                  <div key={i + 1} className="leading-6">{i + 1}</div>
                ))}
              </div>
              
              {/* Code Area */}
              <textarea
                value={code}
                onChange={handleCodeChange}
                className="flex-1 bg-[#1E1E1E] text-[#D4D4D4] font-mono text-sm resize-none focus:outline-none py-4 px-4 leading-6"
                placeholder="// Write your solution here..."
                spellCheck={false}
                style={{ tabSize: 2 }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newCode = code.substring(0, start) + '  ' + code.substring(end);
                    setCode(newCode);
                    setTimeout(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
              />
            </div>
          </div>

          {/* Result Panel */}
          {result && (
            <div className="bg-[#161A19] border-t border-[#2A302E] p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusDisplay()?.icon}
                  <span className={`font-medium ${getStatusDisplay()?.color}`}>
                    {getStatusDisplay()?.text}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#5C6360]">
                  <span>Runtime: {result.runtime}ms</span>
                  <span>Tests: {result.passedTests}/{result.totalTests} passed</span>
                </div>
              </div>
              {result.errorMessage && (
                <pre className="text-sm text-[#F87171] bg-[#0D0F0F] p-3 rounded font-mono whitespace-pre-wrap">
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