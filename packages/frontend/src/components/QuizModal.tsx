import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Award, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/Button';

interface Question {
  _id: string;
  question: string;
  options: string[];
}

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number;
  totalQuestions: number;
}

interface QuizAttempt {
  _id: string;
  startedAt: string;
}

interface QuizModalProps {
  quizId: string;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (score: number, passed: boolean) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quizId,
  lessonId,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback: any[];
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    }
  }, [isOpen, quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && attempt?.startedAt) {
      const startTime = new Date(attempt.startedAt).getTime();
      const limitMs = quiz.timeLimit * 60 * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
      setTimeLeft(remaining);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            if (prev === 1) handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, attempt]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/attempt/${quizId}`);
      const data = response.data.data;
      setQuiz(data.quiz);
      setAttempt(data.attempt);
      
      // Initialize answers
      const initialAnswers: Record<number, number> = {};
      data.quiz.questions.forEach((_: any, index: number) => {
        initialAnswers[index] = -1;
      });
      setAnswers(initialAnswers);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      if (error.response?.data?.message === 'You have already completed this quiz') {
        alert('You have already completed this quiz');
        onClose();
      } else {
        alert('Failed to load quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const allAnswered = Object.values(answers).every((ans) => ans !== -1);
    if (!allAnswered) {
      const confirmSubmit = confirm(
        'You have not answered all questions. Are you sure you want to submit?'
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${quizId}/submit`, {
        answers: Object.values(answers),
      });
      
      const data = response.data.data;
      setResult(data);
      
      if (data.passed) {
        alert(`🎉 Congratulations! You passed with ${data.score}%!`);
      } else {
        alert(`📝 You scored ${data.score}%. Keep learning and try again!`);
      }
      
      onComplete?.(data.score, data.passed);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      alert(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent mx-auto" />
          <p className="text-[#9CA3A0] mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm p-4">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#EDEFEE]">Quiz Results</h2>
            <button onClick={onClose} className="text-[#5C6360] hover:text-[#EDEFEE]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${result.passed ? 'text-[#10B981]' : 'text-[#F87171]'}`}>
              {result.score}%
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {result.passed ? (
                <>
                  <CheckCircle className="w-6 h-6 text-[#10B981]" />
                  <span className="text-lg font-medium text-[#10B981]">Passed! 🎉</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-[#F87171]" />
                  <span className="text-lg font-medium text-[#F87171]">Keep Learning! 📚</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {result.feedback.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  item.isCorrect
                    ? 'border-[#10B981]/30 bg-[#10B981]/5'
                    : 'border-[#F87171]/30 bg-[#F87171]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#F87171]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#EDEFEE]">{item.question}</p>
                    <p className="text-xs text-[#9CA3A0] mt-1">
                      Your answer: <span className={item.isCorrect ? 'text-[#10B981]' : 'text-[#F87171]'}>
                        {item.userAnswer}
                      </span>
                      {!item.isCorrect && (
                        <span className="text-[#10B981]"> • Correct: {item.correctAnswer}</span>
                      )}
                    </p>
                    {item.explanation && (
                      <p className="text-xs text-[#5C6360] mt-1">{item.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="primary" onClick={onClose} className="w-full mt-6">
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestionData = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.values(answers).filter((ans) => ans !== -1).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm p-4">
      <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2A302E]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#EDEFEE]">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-sm text-[#9CA3A0] mt-1">{quiz.description}</p>
              )}
            </div>
            <button onClick={onClose} className="text-[#5C6360] hover:text-[#EDEFEE]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-[#5C6360]">
            <span>Question {currentQuestion + 1} of {totalQuestions}</span>
            <span>•</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
            {timeLeft !== null && (
              <>
                <span>•</span>
                <span className={`flex items-center gap-1 ${timeLeft < 60 ? 'text-[#F87171]' : ''}`}>
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="mb-4">
            <p className="text-lg font-medium text-[#EDEFEE]">
              {currentQuestionData.question}
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestionData.options.map((option, optionIndex) => {
              const isSelected = answers[currentQuestion] === optionIndex;
              return (
                <button
                  key={optionIndex}
                  onClick={() => handleAnswer(currentQuestion, optionIndex)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#EDEFEE]'
                      : 'border-[#2A302E] hover:border-[#10B981]/30 text-[#9CA3A0] hover:text-[#EDEFEE]'
                  }`}
                >
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A302E] flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              size="sm"
            >
              Previous
            </Button>
            {currentQuestion < totalQuestions - 1 && (
              <Button
                variant="secondary"
                onClick={handleNext}
                size="sm"
              >
                Next
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            size="sm"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
  );
};