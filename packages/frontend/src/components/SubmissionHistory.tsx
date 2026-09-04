import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SubmissionHistoryProps {
  submissions: any[];
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  getStatusIcon,
  getStatusColor,
}) => {
  if (submissions.length === 0) {
    return <p className="text-sm text-[#5C6360] italic">No submissions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {submissions.slice(0, 20).map((sub, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-[#1A1D1E] border border-[#2A302E] rounded-lg hover:bg-[#1E2322] transition-colors"
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(sub.status)}
            <span className={`text-sm font-medium ${getStatusColor(sub.status)}`}>
              {sub.status === 'accepted' ? 'Accepted' : sub.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5C6360]">
            <span>Runtime: {sub.runtime || 0}ms</span>
            <span>Memory: {sub.memory || 0}MB</span>
            <span>{new Date(sub.createdAt || sub.submittedAt).toLocaleDateString()}</span>
            <span className="text-[#5C6360]">
              {new Date(sub.createdAt || sub.submittedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};