import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  result: any;
  problem: any;
}

export const StatusBar: React.FC<StatusBarProps> = ({ result, problem }) => {
  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      accepted: <CheckCircle className="w-4 h-4 text-[#10B981]" />,
      wrong_answer: <XCircle className="w-4 h-4 text-[#F87171]" />,
      time_limit: <Clock className="w-4 h-4 text-[#FBBF24]" />,
      memory_limit: <AlertCircle className="w-4 h-4 text-[#FBBF24]" />,
      runtime_error: <XCircle className="w-4 h-4 text-[#F87171]" />,
      compile_error: <XCircle className="w-4 h-4 text-[#F87171]" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4 text-[#5C6360]" />;
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

  return (
    <div className="bg-[#1A1D1E] border-t border-[#2A302E] px-4 py-1.5 flex items-center justify-between text-xs text-[#5C6360] flex-shrink-0">
      <div className="flex items-center gap-4">
        {result ? (
          <>
            <div className={`flex items-center gap-1.5 ${getStatusColor(result.status)}`}>
              {getStatusIcon(result.status)}
              <span className="font-medium">{getStatusText(result.status)}</span>
            </div>
            {result.runtime !== undefined && (
              <span>Runtime: <span className="text-[#EDEFEE]">{result.runtime}ms</span></span>
            )}
            {result.memory !== undefined && (
              <span>Memory: <span className="text-[#EDEFEE]">{result.memory}MB</span></span>
            )}
            {result.passedTests !== undefined && result.totalTests !== undefined && (
              <span>Tests: <span className={result.passedTests === result.totalTests ? 'text-[#10B981]' : 'text-[#F87171]'}>
                {result.passedTests}/{result.totalTests}
              </span> passed</span>
            )}
          </>
        ) : (
          <>
            <span>JavaScript</span>
            <span>•</span>
            <span>{problem?.timeLimit || 2000}ms</span>
            <span>•</span>
            <span>{problem?.memoryLimit || 256}MB</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};