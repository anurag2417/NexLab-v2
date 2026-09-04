// packages/frontend/src/pages/LandingPage.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Instagram, Facebook, MoveRight, 
  Brain, Cpu, Network, Target, 
  Infinity, Layers, TrendingUp, 
  BarChart3, Coffee, Smile, ThumbsUp
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    lessons: 0,
    xpEarned: 0,
  });
  
  // Refs for sections
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // State for visibility animations
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    stats: false,
    testimonials: false,
    cta: false,
  });

  // State for mouse position (parallax)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Stats animation flag
  const [statsAnimated, setStatsAnimated] = useState(false);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle scroll events for visibility and animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Show/hide scroll to top button
      setShowScrollTop(scrollY > 500);

      // Check visibility for each section using getBoundingClientRect
      const checkVisibility = (ref: React.RefObject<HTMLElement>, key: keyof typeof isVisible) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const isElementVisible = rect.top < windowHeight * 0.85;
          if (isElementVisible && !isVisible[key]) {
            setIsVisible(prev => ({ ...prev, [key]: true }));
          }
        }
      };

      checkVisibility(heroRef, 'hero');
      checkVisibility(featuresRef, 'features');
      checkVisibility(testimonialsRef, 'testimonials');
      checkVisibility(ctaRef, 'cta');

      // Check stats visibility and trigger animation
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top < windowHeight * 0.85 && !statsAnimated) {
          setIsVisible(prev => ({ ...prev, stats: true }));
          animateStats();
          setStatsAnimated(true);
        }
      }
    };

    // Initial check after mount
    setTimeout(handleScroll, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, statsAnimated]);

  const animateStats = useCallback(() => {
    const targetStats = {
      students: 15000,
      courses: 120,
      lessons: 850,
      xpEarned: 1250000,
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setStats({
        students: Math.round(targetStats.students * eased),
        courses: Math.round(targetStats.courses * eased),
        lessons: Math.round(targetStats.lessons * eased),
        xpEarned: Math.round(targetStats.xpEarned * eased),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  }, []);

  // Dummy Data
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Senior Software Developer',
      company: 'Tech Mahindra',
      image: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=10B981&color=fff&size=60',
      quote: 'NexLab transformed my coding journey. The interactive courses and sandbox made learning so much easier. I went from zero to building full-stack applications in just 3 months!',
      rating: 5,
      location: 'Mumbai, India'
    },
    {
      name: 'Rahul Verma',
      role: 'Data Scientist',
      company: 'Flipkart',
      image: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=60A5FA&color=fff&size=60',
      quote: 'The Python courses and the code sandbox are exceptional. I love how I can practice coding right in the browser without any setup. This platform is a game-changer for self-learning.',
      rating: 5,
      location: 'Bangalore, India'
    },
    {
      name: 'Ananya Reddy',
      role: 'Full Stack Developer',
      company: 'Freelance',
      image: 'https://ui-avatars.com/api/?name=Ananya+Reddy&background=FBBF24&color=fff&size=60',
      quote: 'I\'ve tried many learning platforms, but NexLab stands out with its gamification and community. The XP system keeps me motivated, and the leaderboard pushes me to learn more every day.',
      rating: 5,
      location: 'Hyderabad, India'
    },
    {
      name: 'Vikram Singh',
      role: 'DevOps Engineer',
      company: 'Amazon India',
      image: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=F87171&color=fff&size=60',
      quote: 'The practical approach and real-world projects at NexLab helped me land my dream job. The community support is incredible!',
      rating: 5,
      location: 'Delhi, India'
    },
    {
      name: 'Sneha Patel',
      role: 'AI/ML Engineer',
      company: 'Google India',
      image: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=10B981&color=fff&size=60',
      quote: 'From Python basics to advanced AI concepts, NexLab has it all. The interactive lessons and coding challenges are perfect for hands-on learning.',
      rating: 5,
      location: 'Pune, India'
    },
    {
      name: 'Arjun Nair',
      role: 'Mobile Developer',
      company: 'Swiggy',
      image: 'https://ui-avatars.com/api/?name=Arjun+Nair&background=60A5FA&color=fff&size=60',
      quote: 'The best part about NexLab is the community. I\'ve made so many connections and learned so much from other students. It\'s more than just a learning platform.',
      rating: 5,
      location: 'Chennai, India'
    },
  ];

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Interactive Courses',
      description: 'Learn from expert-led courses with hands-on projects and real-world applications. 100+ courses available.',
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10',
      delay: '0s',
      stats: '120+ Courses'
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Code Sandbox',
      description: 'Write and test code in Python, JavaScript, Java, and C++ with real-time execution. No setup required.',
      color: 'text-[#60A5FA]',
      bgColor: 'bg-[#60A5FA]/10',
      delay: '0.1s',
      stats: '4 Languages'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Gamification',
      description: 'Earn XP, level up, and unlock badges as you progress through your learning journey. Compete with peers.',
      color: 'text-[#FBBF24]',
      bgColor: 'bg-[#FBBF24]/10',
      delay: '0.2s',
      stats: '50+ Badges'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Learning',
      description: 'Join 15,000+ students across India and collaborate on projects, discussions, and hackathons.',
      color: 'text-[#F87171]',
      bgColor: 'bg-[#F87171]/10',
      delay: '0.3s',
      stats: '15K+ Students'
    },
  ];

  const faqs = [
    {
      question: 'Is NexLab free to use?',
      answer: 'Yes! NexLab offers free courses with a powerful code sandbox. Premium courses start at just ₹499 and include certificates, mentorship, and project reviews.'
    },
    {
      question: 'What programming languages are supported?',
      answer: 'Currently we support Python, JavaScript, Java, C++, HTML/CSS, and SQL. We\'re constantly adding new languages and frameworks.'
    },
    {
      question: 'Can I earn certificates?',
      answer: 'Yes! Upon course completion, you\'ll receive a verified certificate that you can share on LinkedIn, your resume, and professional portfolio.'
    },
    {
      question: 'How does the gamification work?',
      answer: 'You earn XP for completing lessons, quizzes, and challenges. Level up from 1 to 100, unlock 50+ badges, and compete on the global leaderboard!'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Yes! Our mobile app is coming soon. Currently, our platform is fully responsive and works great on all mobile browsers.'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply create a free account, browse our course catalog, and start learning immediately. No credit card required for free courses!'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept UPI, Net Banking, Credit/Debit Cards, PayPal, and all major Indian payment methods. EMI options available on select courses.'
    },
    {
      question: 'Do you offer job placement assistance?',
      answer: 'Yes! We have a dedicated placement cell that helps students with resume building, interview preparation, and connects them with top companies.'
    },
  ];

  const languages = [
    { name: 'Python', icon: '🐍', color: 'text-[#10B981]', students: '5,000+' },
    { name: 'JavaScript', icon: '⚡', color: 'text-[#FBBF24]', students: '4,500+' },
    { name: 'Java', icon: '☕', color: 'text-[#F87171]', students: '3,200+' },
    { name: 'C++', icon: '⚙️', color: 'text-[#60A5FA]', students: '2,800+' },
    { name: 'React', icon: '⚛️', color: 'text-[#61DAFB]', students: '2,100+' },
    { name: 'Node.js', icon: '🟢', color: 'text-[#68A063]', students: '1,800+' },
  ];

  const categories = [
    { name: 'Web Development', icon: '🌐', color: 'bg-[#10B981]/10 text-[#10B981]' },
    { name: 'Data Science', icon: '📊', color: 'bg-[#60A5FA]/10 text-[#60A5FA]' },
    { name: 'Mobile Apps', icon: '📱', color: 'bg-[#FBBF24]/10 text-[#FBBF24]' },
    { name: 'Cloud Computing', icon: '☁️', color: 'bg-[#F87171]/10 text-[#F87171]' },
    { name: 'DevOps', icon: '🔄', color: 'bg-[#10B981]/10 text-[#10B981]' },
    { name: 'AI/ML', icon: '🤖', color: 'bg-[#60A5FA]/10 text-[#60A5FA]' },
  ];

  const partners = [
    { name: 'Tech Mahindra', logo: 'https://ui-avatars.com/api/?name=Tech+Mahindra&background=10B981&color=fff&size=60' },
    { name: 'Flipkart', logo: 'https://ui-avatars.com/api/?name=Flipkart&background=60A5FA&color=fff&size=60' },
    { name: 'Amazon', logo: 'https://ui-avatars.com/api/?name=Amazon&background=FBBF24&color=fff&size=60' },
    { name: 'Google', logo: 'https://ui-avatars.com/api/?name=Google&background=F87171&color=fff&size=60' },
    { name: 'Microsoft', logo: 'https://ui-avatars.com/api/?name=Microsoft&background=10B981&color=fff&size=60' },
    { name: 'Swiggy', logo: 'https://ui-avatars.com/api/?name=Swiggy&background=60A5FA&color=fff&size=60' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0D0F0F] overflow-x-hidden">
      {/* Navigation - Bigger Text */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0F0F]/80 backdrop-blur-xl border-b border-[#2A302E] transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <BrandLogo size="md" showText={true} />

            {/* Desktop Navigation - Bigger text */}
            <div className="hidden md:flex items-center gap-10">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-lg font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#10B981] transition-all duration-300 group-hover:w-full" />
              </button>
              <button 
                onClick={() => scrollToSection('languages')} 
                className="text-lg font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors relative group"
              >
                Languages
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#10B981] transition-all duration-300 group-hover:w-full" />
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')} 
                className="text-lg font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors relative group"
              >
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#10B981] transition-all duration-300 group-hover:w-full" />
              </button>
              <button 
                onClick={() => scrollToSection('faq')} 
                className="text-lg font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors relative group"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#10B981] transition-all duration-300 group-hover:w-full" />
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Button variant="primary" onClick={() => navigate('/dashboard')} className="gap-2 group text-base px-6 py-3">
                  Dashboard 
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')} className="text-base px-4 py-2.5">
                    Sign In
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/register')} className="gap-2 group text-base px-6 py-3">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
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
            <div className="md:hidden py-4 border-t border-[#2A302E] animate-in slide-in-from-top duration-200">
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="text-base font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('languages')} 
                  className="text-base font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Languages
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')} 
                  className="text-base font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  Testimonials
                </button>
                <button 
                  onClick={() => scrollToSection('faq')} 
                  className="text-base font-medium text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors px-4 py-2 rounded-lg hover:bg-[#1E2322] text-left"
                >
                  FAQ
                </button>
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[#2A302E]">
                  {user ? (
                    <Button variant="primary" onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-base">
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="w-full text-base">
                        Sign In
                      </Button>
                      <Button variant="primary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }} className="w-full text-base">
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

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="min-h-screen flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-20"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/5 via-transparent to-[#059669]/5" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#60A5FA]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#10B981]/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          {/* Animated Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-6 transition-all duration-700 ${
            isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Sparkles className="w-4 h-4 text-[#10B981] animate-spin-slow" />
            <span className="text-xs font-medium text-[#10B981]">🇮🇳 India's #1 Coding Platform • 15,000+ Students</span>
          </div>

          {/* Main Heading with Parallax */}
          <div 
            className={`transition-all duration-1000 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{
              transform: isVisible.hero ? `translateY(0) rotate(${mousePosition.x * 0.02}deg)` : 'translateY(10px)',
            }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-[#EDEFEE] mb-6 leading-[1.1]">
              Learn, Code, and
              <span className="text-[#10B981] block md:inline"> Grow</span>
              <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl text-[#9CA3A0] mt-4 md:mt-2">
                From 🇮🇳 India, For the World
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className={`text-lg sm:text-xl md:text-2xl text-[#9CA3A0] max-w-3xl mx-auto mb-8 leading-relaxed transition-all duration-700 delay-300 ${
            isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Interactive courses with a powerful code sandbox. 
            Join 15,000+ students and start your learning journey today.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${
            isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {user ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')} className="gap-2 group text-base sm:text-lg px-8 py-4">
                Go to Dashboard 
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={() => navigate('/register')} className="gap-2 group text-base sm:text-lg px-8 py-4">
                  Start Learning Free 
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/login')} className="text-base sm:text-lg px-8 py-4">
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className={`flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-[#5C6360] transition-all duration-700 delay-700 ${
            isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
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
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              98% placement rate
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="w-full py-16 px-4 sm:px-6 lg:px-8 border-t border-[#2A302E] bg-gradient-to-b from-[#0D0F0F] to-[#161A19]">
        <div className="max-w-7xl mx-auto">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 ${
            isVisible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {[
              { value: stats.students.toLocaleString(), label: 'Students', color: 'text-[#10B981]', icon: <Users className="w-8 h-8" /> },
              { value: stats.courses.toLocaleString(), label: 'Courses', color: 'text-[#60A5FA]', icon: <BookOpen className="w-8 h-8" /> },
              { value: stats.lessons.toLocaleString(), label: 'Lessons', color: 'text-[#FBBF24]', icon: <GraduationCap className="w-8 h-8" /> },
              { value: stats.xpEarned.toLocaleString(), label: 'XP Earned', color: 'text-[#F87171]', icon: <Award className="w-8 h-8" /> },
            ].map((stat, index) => (
              <div
                key={index}
                className="group p-6 bg-[#161A19] rounded-xl border border-[#2A302E] text-center hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#10B981]/5 hover:-translate-y-1"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`${stat.color} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <p className={`text-3xl md:text-4xl font-bold ${stat.color} transition-all duration-1000`}>
                  {stat.value}+
                </p>
                <p className="text-sm text-[#9CA3A0] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories - Fixed padding */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 border-b border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-[#EDEFEE]">
              Popular <span className="text-[#10B981]">Course Categories</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat, index) => (
              <span
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium ${cat.color} border border-current/20 hover:scale-105 transition-transform cursor-pointer`}
              >
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EDEFEE]">
              Everything You Need to <span className="text-[#10B981]">Learn Coding</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto text-lg">
              Our platform combines interactive courses, a powerful code sandbox, and gamification to make learning fun and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-[#161A19] border border-[#2A302E] rounded-xl p-6 hover:bg-[#1E2322] hover:border-[#10B981]/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#10B981]/5 ${
                  isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: feature.delay }}
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-[#EDEFEE] mb-2 group-hover:text-[#10B981] transition-colors">{feature.title}</h3>
                <p className="text-sm text-[#9CA3A0] leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-2 text-[#10B981]">
                  <span className="text-sm font-medium">{feature.stats}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section id="languages" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#161A19] to-[#0D0F0F] border-y border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EDEFEE]">
              <span className="text-[#10B981]">Multi-Language</span> Code Sandbox
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto text-lg">
              Write and execute code in your favorite programming languages directly in the browser.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {languages.map((lang, index) => (
              <div
                key={index}
                className="group bg-[#0D0F0F] border border-[#2A302E] rounded-xl p-6 text-center hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#10B981]/5 hover:-translate-y-1"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-5xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{lang.icon}</div>
                <p className={`font-semibold ${lang.color} transition-colors duration-300 group-hover:text-[#10B981]`}>{lang.name}</p>
                <p className="text-xs text-[#5C6360] mt-1">{lang.students}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EDEFEE]">
              How <span className="text-[#10B981]">It Works</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto text-lg">
              Get started in three simple steps and begin your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[#10B981]/20 via-[#10B981]/40 to-[#10B981]/20" />
            
            {[
              { number: '01', title: 'Create Account', description: 'Sign up for free and access all courses instantly. No credit card needed.' },
              { number: '02', title: 'Choose a Course', description: 'Browse our catalog of 120+ courses and pick your learning path.' },
              { number: '03', title: 'Start Learning', description: 'Watch lessons, write code, earn XP, and track your progress.' },
            ].map((step, index) => (
              <div
                key={index}
                className="relative group text-center"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative z-10 w-20 h-20 mx-auto bg-[#161A19] border-2 border-[#10B981] rounded-2xl flex items-center justify-center text-[#10B981] text-2xl font-bold mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#10B981]/20">
                  <span className="text-sm">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#EDEFEE] mb-3">{step.title}</h3>
                <p className="text-sm text-[#9CA3A0] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section - Fixed padding and spacing */}
      <section className="w-full py-10 px-4 sm:px-6 lg:px-8 bg-[#161A19] border-y border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-[#EDEFEE]">
              Trusted by <span className="text-[#10B981]">Leading Companies</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="p-3 bg-[#0D0F0F] rounded-xl border border-[#2A302E] hover:border-[#10B981]/30 transition-all hover:scale-105"
              >
                <img src={partner.logo} alt={partner.name} className="h-10 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialsRef} className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#161A19] border-y border-[#2A302E]">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EDEFEE]">
              What Our <span className="text-[#10B981]">Students Say</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 max-w-2xl mx-auto text-lg">
              Hear from real students across India who transformed their careers with NexLab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-[#0D0F0F] border border-[#2A302E] rounded-xl p-6 hover:border-[#10B981]/20 transition-all duration-500 hover:shadow-xl hover:shadow-[#10B981]/5 hover:-translate-y-2 ${
                  isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full border-2 border-[#10B981]/20"
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

      {/* FAQ Section - Fixed padding */}
      <section id="faq" className="w-full py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#EDEFEE]">
              Frequently Asked <span className="text-[#10B981]">Questions</span>
            </h2>
            <p className="text-[#9CA3A0] mt-4 text-lg">
              Find answers to common questions about NexLab.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#10B981]/30"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#1E2322] transition-colors">
                  <span className="font-medium text-[#EDEFEE] group-hover:text-[#10B981] transition-colors">
                    {faq.question}
                  </span>
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

      {/* CTA Section */}
      <section id="cta" ref={ctaRef} className="w-full py-20 px-4 sm:px-6 lg:px-8 border-t border-[#2A302E] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/10 via-[#059669]/5 to-transparent" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#60A5FA]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-700 ${
          isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl shadow-[#10B981]/20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">
              Join 15,000+ students across India and start your coding journey today.
            </p>
            {user ? (
              <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')} className="gap-2 group text-base sm:text-lg px-8 py-4">
                Go to Dashboard 
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={() => navigate('/register')} className="gap-2 group text-base sm:text-lg px-8 py-4">
                Create Free Account 
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            )}
            <p className="text-white/60 text-xs mt-4">
              No credit card required • Free forever • UPI & Indian payments accepted
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#161A19] border-t border-[#2A302E] pt-12 pb-6 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <BrandLogo size="lg" showText={true} />
              <p className="text-sm text-[#9CA3A0] mt-4 mb-4 leading-relaxed">
                Learn, Code, and Grow with interactive courses and a powerful code sandbox.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-all hover:scale-110 transform">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-all hover:scale-110 transform">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-all hover:scale-110 transform">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-all hover:scale-110 transform">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5C6360] hover:text-[#EDEFEE] transition-all hover:scale-110 transform">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('languages')} 
                    className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block"
                  >
                    Languages
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('testimonials')} 
                    className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block"
                  >
                    Testimonials
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('faq')} 
                    className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block">Blog</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block">Documentation</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block">Support</a></li>
                <li><a href="#" className="text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors hover:translate-x-1 transform inline-block">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-[#EDEFEE] mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-[#9CA3A0] group">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-[#10B981] transition-colors" />
                  <span className="group-hover:text-[#EDEFEE] transition-colors">support@nexlab.in</span>
                </li>
                <li className="flex items-start gap-2 text-[#9CA3A0] group">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-[#10B981] transition-colors" />
                  <span className="group-hover:text-[#EDEFEE] transition-colors">+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-2 text-[#9CA3A0] group">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-[#10B981] transition-colors" />
                  <span className="text-xs leading-relaxed group-hover:text-[#EDEFEE] transition-colors">
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
          className="fixed bottom-8 right-8 p-3 bg-[#10B981] hover:bg-[#34D399] text-white rounded-full shadow-lg shadow-[#10B981]/20 transition-all duration-300 z-40 hover:scale-110 transform"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;