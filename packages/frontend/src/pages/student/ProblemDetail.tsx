import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { CodeEditor } from '../../components/CodeEditor';

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

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (slug) fetchProblem();
  }, [slug]);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data.problem);
      setCode(data.problem.starterCode || '// Write your solution here');
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/problems');
    } finally {
      setLoading(false);
    }
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
        <div className="flex flex-col bg-[#0D0F0F] p-4">
          <CodeEditor
            value={code}
            onChange={setCode}
            language="javascript"
            height="100%"
            showLineNumbers={true}
            onRun={handleRun}
            onSubmit={handleSubmit}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />

          {/* Result Panel */}
          {result && (
            <div className="mt-4 bg-[#161A19] border border-[#2A302E] rounded-lg p-4 max-h-40 overflow-y-auto">
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