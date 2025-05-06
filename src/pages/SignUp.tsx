import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { COLLECTIONS, updateDocument } from '@/lib/firebase/firestore';

const SignUp = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roleParam = queryParams.get('role');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState(roleParam === 'seller' ? 'seller' : 'client');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signUp, error, isLoading, clearError, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name || !email || !password) {
      // We can't set the error directly since it's coming from context,
      // so we'll handle this validation in the UI by checking for empty fields
      return;
    }
    
    if (password.length < 8) {
      // Display an alert since we can't set the error in context
      alert('Password must be at least 8 characters long.');
      return;
    }
    
    try {
      // Set isSeller based on the account type
      const isSeller = accountType === 'seller';
      
      // Pass the isSeller value directly to the signUp function
      const user = await signUp(email, password, name, isSeller);
      
      // Redirect based on account type
      if (isSeller) {
        navigate('/seller/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Signup error:', err);
      // Error handling is done in the AuthContext
    }
  };
  
  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '' };
    
    if (password.length < 8) {
      return { strength: 1, label: 'Weak' };
    } else if (password.length < 12) {
      return { strength: 2, label: 'Medium' };
    } else {
      return { strength: 3, label: 'Strong' };
    }
  };
  
  const { strength, label } = getPasswordStrength();
  
  return (
    <div className="min-h-screen pt-28 pb-16 flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="mt-2 text-muted-foreground">
              Join GigHubify to connect with video editors or start selling your services
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="account-type" className="block text-sm font-medium mb-1">
                    I want to:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`p-3 border rounded-lg flex items-center justify-center transition-all ${
                        accountType === 'client'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => setAccountType('client')}
                    >
                      <CheckCircle2 className={`h-5 w-5 mr-2 ${accountType === 'client' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Hire editors</span>
                    </button>
                    <button
                      type="button"
                      className={`p-3 border rounded-lg flex items-center justify-center transition-all ${
                        accountType === 'seller'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => setAccountType('seller')}
                    >
                      <CheckCircle2 className={`h-5 w-5 mr-2 ${accountType === 'seller' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>Work as an editor</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              strength === 1 ? 'w-1/3 bg-destructive' :
                              strength === 2 ? 'w-2/3 bg-yellow-500' :
                              'w-full bg-green-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs ml-2 w-16 text-muted-foreground">{label}</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Use 8+ characters with a mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <span className="text-muted-foreground text-sm">Already have an account?</span>{' '}
              <Link to="/signin" className="text-sm text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
