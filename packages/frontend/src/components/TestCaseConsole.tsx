import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface TestCaseConsoleProps {
  visibleTestCases: any[];
  result: any;
  selectedTestCase: number;
  setSelectedTestCase: (index: number) => void;
  getPassedVisibleCount: () => number;
  getTotalVisibleCount: () => number;
  getTestCaseResult: (index: number) => any;
}

export const TestCaseConsole: React.FC<TestCaseConsoleProps> = ({
  visibleTestCases,
  result,
  selectedTestCase,
  setSelectedTestCase,
  getPassedVisibleCount,
  getTotalVisibleCount,
  getTestCaseResult,
}) => {
  if (visibleTestCases.length === 0) {
    return <p className="text-sm text-[#5C6360]">No test cases available</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#5C6360]">Test Cases</span>
        {result && (
          <span className="text-xs text-[#5C6360]">
            {getPassedVisibleCount()} / {getTotalVisibleCount()} visible tests passed
          </span>
        )}
      </div>

      <div className="space-y-2">
        {visibleTestCases.map((testCase: any, index: number) => {
          const testResult = getTestCaseResult(index);
          const passed = testResult?.passed;
          const hasResult = testResult !== null;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTestCase === index
                  ? 'bg-[#10B981]/10 border border-[#10B981]/30'
                  : 'hover:bg-[#1E2322]'
              } ${hasResult ? (passed ? 'border-l-4 border-l-[#10B981]' : 'border-l-4 border-l-[#F87171]') : ''}`}
              onClick={() => setSelectedTestCase(index)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3A0]">Case {index + 1}</span>
                {hasResult ? (
                  passed ? (
                    <span className="flex items-center gap-1 text-[#10B981] text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#F87171] text-sm">
                      <XCircle className="w-4 h-4" />
                      Failed
                    </span>
                  )
                ) : (
                  <span className="text-xs text-[#5C6360]">⏳</span>
                )}
              </div>
              <div className="text-xs text-[#5C6360] mt-1 truncate">
                Input: {testCase.input.substring(0, 50)}...
              </div>

              {/* ✅ Show detailed test case result when selected */}
              {selectedTestCase === index && testResult && (
                <div className="mt-3 p-3 bg-[#0D0F0F] rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5C6360]">Input:</span>
                    <span className="text-[#EDEFEE] font-mono">{testCase.input}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5C6360]">Expected:</span>
                    <span className="text-[#10B981] font-mono">{testCase.expectedOutput}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5C6360]">Got:</span>
                    <span className={`font-mono ${testResult.passed ? 'text-[#10B981]' : 'text-[#F87171]'}`}>
                      {testResult.got || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};