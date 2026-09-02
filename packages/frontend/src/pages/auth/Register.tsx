import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Sparkles } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center px-4">
      <div className="bg-[#161A19] p-8 rounded-xl border border-[#2A302E] shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold text-[#10B981]">Nex</span>
            <span className="text-2xl font-bold text-[#EDEFEE]">Lab</span>
            <Sparkles className="w-4 h-4 text-[#10B981]" />
          </div>
          <h1 className="text-2xl font-bold text-[#EDEFEE]">Create Account</h1>
          <p className="text-[#9CA3A0] mt-1">Start your learning journey today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg text-[#F87171] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] transition-all duration-200"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating account...' : 'Get Started'}
          </Button>
        </form>

        <p className="text-center text-sm text-[#9CA3A0] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#10B981] hover:text-[#34D399] font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};