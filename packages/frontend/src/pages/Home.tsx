import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const Home: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background-muted flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-5xl font-bold text-primary-600">Nex</span>
          <span className="text-5xl font-bold text-text-heading">Lab</span>
        </div>
        <p className="text-xl text-text-body mb-8">
          Learn, Code, and Grow with interactive courses and a powerful sandbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};