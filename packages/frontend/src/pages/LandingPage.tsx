// packages/frontend/src/pages/LandingPage.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { 
  BookOpen, Code2, Trophy, Users, Sparkles, 
  ArrowRight, CheckCircle, Star, Play, 
  Award, Zap, Shield, Globe, MessageCircle,
  ChevronRight, Menu, X, GraduationCap,
  Clock, Briefcase, Rocket, Heart, 
  Twitter, Linkedin, Github, Youtube,
  Mail, MapPin, Phone, ChevronUp,
  Instagram, Facebook
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Handle scroll for scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  // Static Data
  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Interactive Courses',
      description: 'Learn from expert-led courses with hands-on projects and real-world applications.',
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10',
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Code Sandbox',
      description: 'Write and test code in Python, JavaScript, Java, and C++ with real-time execution.',
      color: 'text-[#60A5FA]',
      bgColor: 'bg-[#60A5FA]/10',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Gamification',
      description: 'Earn XP, level up, and unlock badges as you progress through your learning journey.',
      color: 'text-[#FBBF24]',
      bgColor: 'bg-[#FBBF24]/10',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Learning',
      description: 'Join thousands of students across India and collaborate on projects and discussions.',
      color: 'text-[#F87171]',
      bgColor: 'bg-[#F87171]/10',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Software Developer',
      company: 'Tech Mahindra',
      image: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=10B981&color=fff&size=60',
      quote: 'NexLab transformed my coding journey. The interactive courses and sandbox made learning so much easier!',
      rating: 5,
      location: 'Mumbai, India'
    },
    {
      name: 'Rahul Verma',
      role: 'Data Scientist',
      company: 'Flipkart',
      image: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=60A5FA&color=fff&size=60',
      quote: 'The Python courses and the code sandbox are exceptional. This platform is a game-changer for self-learning.',
      rating: 5,
      location: 'Bangalore, India'
    },
    {
      name: 'Ananya Reddy',
      role: 'Full Stack Developer',
      company: 'Freelance',
      image: 'https://ui-avatars.com/api/?name=Ananya+Reddy&background=FBBF24&color=fff&size=60',
      quote: 'I\'ve tried many learning platforms, but NexLab stands out with its gamification and community. Absolutely love it!',
      rating: 5,
      location: 'Hyderabad, India'
    },
  ];

  const faqs = [
    {
      question: 'Is NexLab free to use?',
      answer: 'Yes! NexLab offers free courses with a powerful code sandbox. Premium courses start at just ₹499.'
    },
    {
      question: 'What programming languages are supported?',
      answer: 'Currently we support Python, JavaScript, Java, and C++. More languages coming soon!'
    },
    {
      question: 'Can I earn certificates?',
      answer: 'Yes! Upon course completion, you\'ll receive a certificate that you can share on LinkedIn and your resume.'
    },
    {
      question: 'How does the gamification work?',
      answer: 'You earn XP for completing lessons and quizzes. Level up, unlock badges, and compete on the leaderboard!'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Not yet, but our platform is fully responsive and works great on mobile browsers!'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply create a free account and start exploring our courses. You can begin learning immediately!'
    },
  ];

  const languages = [
    { name: 'Python', icon: '🐍', color: 'text-[#10B981]' },
    { name: 'JavaScript', icon: '⚡', color: 'text-[#FBBF24]' },
    { name: 'Java', icon: '☕', color: 'text-[#F87171]' },
    { name: 'C++', icon: '⚙️', color: 'text-[#60A5FA]' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0D0F0F] overflow-x-hidden">
      {/* Navigation - Static */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0F0F]/95 backdrop-blur-sm border-b border-[#2A302E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <BrandLogo size="md" showText={true} />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('languages')} 
                className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
              >
                Languages
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')} 
                className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('faq')} 
                className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
              >
                FAQ
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/register')}>
                    Get Started Free
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#2A302E]">
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('languages')} 
                  className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Languages
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')} 
                  className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Testimonials
                </button>
                <button 
                  onClick={() => scrollToSection('faq')} 
                  className="text-sm text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  FAQ
                </button>
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[#2A302E]">
                  {user ? (
                    <Button variant="primary" onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}>
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                        Sign In
                      </Button>
                      <Button variant="primary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                        Get Started Free
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Static */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10B981]/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#60A5FA]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs font-medium text-[#10B981]">🇮🇳 10,000+ Students Trust NexLab India</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#EDEFEE] mb-6 leading-tight">
            Learn, Code, and
            <span className="text-[#10B981]"> Grow</span>
            <span className="block text-2xl md:text-3xl lg:text-4xl text-[#9CA3A0] mt-2">
              From 🇮🇳 India, For the World
            </span>
          </h1>
          
          <p className="text-xl text-[#9CA3A0] max-w-2xl mx-auto mb-8 leading-relaxed">
            Interactive courses with a powerful code sandbox. 
            Start your learning journey today and become a developer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
                  Start Learning Free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-[#5C6360]">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              UPI & Indian payments accepted
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section - Static */}
      <section className="py-16 px-4 border-t border-[#2A302E] bg-[#0D0F0F]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 bg-[#161A19] rounded-xl border border-[#2A302E]">
              <p className="text-3xl md:text-4xl font-bold text-[#10B981]">15,000+</p>
              <p className="text-sm text-[#9CA3A0] mt-1">Students</p>
            </div>
            <div className="p-6 bg-[#161A19] rounded-xl border border-[#2A302E]">
              <p className="text-3xl md:text-4xl font-bold text-[#60A5FA]">120+</p>
              <p className="text-sm text-[#9CA3A0] mt-1">Courses</p>
            </div>
            <div className="p-6 bg-[#161A19] rounded-xl border border-[#2A302E]">
              <p className="text-3xl md:text-4xl font-bold text-[#FBBF24]">850+</p>
              <p className="text-sm text-[#9CA3A0] mt-1">Lessons</p>
            </div>
            <div className="p-6 bg-[#161A19] rounded-xl border border-[#2A302E]">
              <p className="text-3xl md:text-4xl font-bold text-[#F87171]">12.5L+</p>
              <p className="text-sm text-[#9CA3A0] mt-1">XP Earned</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Static */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#EDEFEE]">
              Everything You Need to <span className="text-[#10B981]">Learn Coding</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto">
              Our platform combines interactive courses, a powerful code sandbox, and gamification to make learning fun and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-[#161A19] border border-[#2A302E] rounded-xl p-6 hover:bg-[#1E2322] hover:border-[#10B981]/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-[#EDEFEE] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#9CA3A0] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section - Static */}
      <section id="languages" className="py-20 px-4 bg-[#161A19] border-y border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#EDEFEE]">
              <span className="text-[#10B981]">Multi-Language</span> Code Sandbox
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto">
              Write and execute code in your favorite programming languages directly in the browser.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {languages.map((lang, index) => (
              <div
                key={index}
                className="bg-[#0D0F0F] border border-[#2A302E] rounded-xl p-6 text-center hover:border-[#10B981]/30 transition-all duration-300"
              >
                <div className="text-4xl mb-2">{lang.icon}</div>
                <p className={`font-semibold ${lang.color}`}>{lang.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Static */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#EDEFEE]">
              How <span className="text-[#10B981]">It Works</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto">
              Get started in three simple steps and begin your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#10B981]">
                1
              </div>
              <h3 className="text-lg font-semibold text-[#EDEFEE] mb-2">Create Account</h3>
              <p className="text-sm text-[#9CA3A0]">Sign up for free and access all courses instantly.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#10B981]">
                2
              </div>
              <h3 className="text-lg font-semibold text-[#EDEFEE] mb-2">Choose a Course</h3>
              <p className="text-sm text-[#9CA3A0]">Browse our catalog and pick your learning path.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#10B981]">
                3
              </div>
              <h3 className="text-lg font-semibold text-[#EDEFEE] mb-2">Start Learning</h3>
              <p className="text-sm text-[#9CA3A0]">Watch lessons, write code, and earn XP as you progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Static */}
      <section id="testimonials" className="py-20 px-4 bg-[#161A19] border-y border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#EDEFEE]">
              What Our <span className="text-[#10B981]">Students Say</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto">
              Hear from real students across India who transformed their careers with NexLab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-[#0D0F0F] border border-[#2A302E] rounded-xl p-6 hover:border-[#10B981]/20 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-[#EDEFEE]">{testimonial.name}</p>
                    <p className="text-xs text-[#9CA3A0]">{testimonial.role} • {testimonial.company}</p>
                    <p className="text-xs text-[#5C6360]">📍 {testimonial.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= testimonial.rating
                          ? 'fill-[#FBBF24] text-[#FBBF24]'
                          : 'text-[#2A302E]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-[#9CA3A0] leading-relaxed">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Static */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#EDEFEE]">
              Frequently Asked <span className="text-[#10B981]">Questions</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4">
              Find answers to common questions about NexLab.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#1E2322] transition-colors">
                  <span className="font-medium text-[#EDEFEE]">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-[#9CA3A0] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#9CA3A0] leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Static */}
      <section className="py-20 px-4 border-t border-[#2A302E]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl p-8 md:p-12 text-center shadow-xl shadow-[#10B981]/10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Join thousands of students across India and start your coding journey today.
            </p>
            {user ? (
              <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={() => navigate('/register')}>
                Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <p className="text-white/60 text-xs mt-4">
              No credit card required • Free forever • UPI & Indian payments accepted
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Static */}
      <footer className="bg-[#161A19] border-t border-[#2A302E] pt-12 pb-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <BrandLogo size="lg" showText={true} />
              <p className="text-sm text-[#9CA3A0] mt-4 mb-4">
                Learn, Code, and Grow with interactive courses and a powerful code sandbox.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('languages')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Languages</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Testimonials</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">FAQ</button></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Blog</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Documentation</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Support</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-[#9CA3A0]">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>support@nexlab.in</span>
                </li>
                <li className="flex items-start gap-2 text-[#9CA3A0]">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-2 text-[#9CA3A0]">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs leading-relaxed">
                    Nexus Tower, Hitech City,<br />
                    Hyderabad, Telangana - 500081<br />
                    🇮🇳 India
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-[#2A302E] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5C6360]">
            <p>© {currentYear} NexLab. All rights reserved. 🇮🇳 Made in India</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#9CA3A0] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#9CA3A0] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#9CA3A0] transition-colors">Cookies</a>
              <a href="#" className="hover:text-[#9CA3A0] transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-[#10B981] hover:bg-[#34D399] text-white rounded-full shadow-lg shadow-[#10B981]/20 transition-all duration-300 z-40"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;