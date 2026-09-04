// packages/frontend/src/components/SubmissionHistory.tsx

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { formatSubmissionDate } from '../utils/dateUtils';

interface SubmissionHistoryProps {
  submissions: any[];
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  problemTitle?: string;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  getStatusIcon,
  getStatusColor,
  problemTitle,
}) => {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#5C6360] py-8">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="font-medium text-[#9CA3A0]">No submissions yet</p>
        <p className="text-sm">
          {problemTitle 
            ? `You haven't submitted any solutions for "${problemTitle}" yet.` 
            : 'Submit your solution to see it here.'}
        </p>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      accepted: 'Accepted',
      wrong_answer: 'Wrong Answer',
      time_limit: 'Time Limit Exceeded',
      memory_limit: 'Memory Limit Exceeded',
      runtime_error: 'Runtime Error',
      compile_error: 'Compile Error',
      pending: 'Pending',
    };
    return map[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const map: Record<string, string> = {
      accepted: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
      wrong_answer: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30',
      time_limit: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
      memory_limit: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
      runtime_error: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30',
      compile_error: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30',
      pending: 'bg-[#5C6360]/20 text-[#5C6360] border-[#5C6360]/30',
    };
    return map[status] || 'bg-[#2A302E] text-[#9CA3A0]';
  };

  return (
    <div className="space-y-2">
      {problemTitle && (
        <div className="text-xs text-[#5C6360] mb-3">
          Showing submissions for: <span className="text-[#EDEFEE] font-medium">{problemTitle}</span>
        </div>
      )}
      
      {submissions.slice(0, 20).map((sub, index) => {
        const status = sub.status || 'pending';
        
        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-[#1A1D1E] border border-[#2A302E] rounded-lg hover:bg-[#1E2322] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {getStatusIcon(status)}
              <div className="min-w-0">
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                  {getStatusDisplay(status)}
                </span>
                {!problemTitle && sub.problemId?.title && (
                  <p className="text-xs text-[#5C6360] truncate">{sub.problemId.title}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[#5C6360] mt-0.5">
                  <span>Runtime: {sub.runtime || 0}ms</span>
                  <span>Memory: {sub.memory || 0}MB</span>
                  <span>{sub.passedTests || 0}/{sub.totalTests || 0} tests</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end text-xs text-[#5C6360] flex-shrink-0 ml-3">
              {/* ✅ Use IST format */}
              <span>{formatSubmissionDate(sub.createdAt || sub.submittedAt)}</span>
            </div>
          </div>
        );
      })}
      
      {submissions.length > 20 && (
        <div className="text-center text-xs text-[#5C6360] pt-2">
          Showing 20 of {submissions.length} submissions
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;