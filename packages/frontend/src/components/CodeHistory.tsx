import React, { useState } from 'react';
import { Clock, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

interface CodeHistoryProps {
  codeHistory: string[];
  onRestoreCode: (code: string) => void;
}

export const CodeHistory: React.FC<CodeHistoryProps> = ({ codeHistory, onRestoreCode }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  if (codeHistory.length === 0) {
    return <p className="text-sm text-[#5C6360] italic">No code history yet. Start writing code!</p>;
  }

  const clearHistory = () => {
    if (confirm('Clear all code history?')) {
      localStorage.removeItem('code_history');
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#5C6360]">Code Versions ({codeHistory.length} saved)</span>
        <button
          onClick={clearHistory}
          className="text-xs text-[#5C6360] hover:text-[#F87171] transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear History
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {codeHistory.slice().reverse().map((code, index) => {
          const versionNumber = codeHistory.length - index;
          const isSelected = selectedVersion === index;
          const preview = code.substring(0, 100) + (code.length > 100 ? '...' : '');

          return (
            <div
              key={index}
              className={`p-3 bg-[#1A1D1E] border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'border-[#10B981]' : 'border-[#2A302E]'
              } hover:border-[#10B981]`}
              onClick={() => setSelectedVersion(index)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-[#5C6360]" />
                  <span className="text-xs font-medium text-[#EDEFEE]">Version #{versionNumber}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestoreCode(code);
                    setSelectedVersion(null);
                  }}
                  className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restore
                </button>
              </div>
              <pre className="text-xs text-[#5C6360] font-mono whitespace-pre-wrap">{preview}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};