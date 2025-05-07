import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, PlusCircle, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserProfile, isUserSeller } from '@/lib/services/user.service';

const Navbar = () => {
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  // Check if user is a seller
  useEffect(() => {
    const checkSellerStatus = async () => {
      if (currentUser) {
        try {
          // First clear the seller status to avoid stale data
          setIsSeller(false);
          
          // Then fetch the latest status
          const sellerStatus = await isUserSeller(currentUser.uid);
          setIsSeller(sellerStatus);
          
          console.log(`User ${currentUser.uid} seller status: ${sellerStatus}`);
        } catch (err) {
          console.error('Error checking seller status:', err);
          setIsSeller(false);
        }
      } else {
        // If no user is logged in, ensure seller status is false
        setIsSeller(false);
      }
    };
    
    checkSellerStatus();
  }, [currentUser]);
  
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glassmorphism py-3' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/gighubify-logo.png" 
              alt="" 
              className="h-10 w-auto mr-2"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              GigHubify
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/explore" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/explore' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Explore
            </Link>
            <Link 
              to="/blog" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/blog' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Blog
            </Link>
            <Link 
              to="/contact" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/contact' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Contact
            </Link>
            {!currentUser && (
            <Link 
              to="/become-seller" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/become-seller' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Become a Seller
            </Link>
            )}
            {currentUser && isSeller && (
              <Link 
                to="/seller/dashboard" 
                className={`font-medium transition-colors hover:text-primary ${location.pathname === '/seller/dashboard' ? 'text-primary' : 'text-foreground/80'}`}
              >
                Seller Dashboard
              </Link>
            )}
            <div className="flex items-center space-x-4">
              {!currentUser ? (
                <>
              <Link 
                to="/signin" 
                className={`font-medium transition-colors hover:text-primary ${location.pathname === '/signin' ? 'text-primary' : 'text-foreground/80'}`}
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary"
              >
                Sign Up
              </Link>
                </>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-accent transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {currentUser.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt={currentUser.displayName || 'User'} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-lg shadow-lg border border-border z-50">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="font-medium truncate">{currentUser.displayName || currentUser.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          to="/dashboard" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Buyer Dashboard
                        </Link>
                        
                        {isSeller && (
                          <Link 
                            to="/seller/dashboard" 
                            className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Seller Dashboard
                          </Link>
                        )}
                      </div>
                      
                      <div className="border-t border-border py-1">
                        <button 
                          onClick={handleSignOut}
                          className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-accent"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentUser && isSeller && (
              <Link
                to="/add-gig"
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                title="Add a new gig"
              >
                <PlusCircle size={20} />
              </Link>
              )}
              
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-4">
            {currentUser && isSeller && (
            <Link
              to="/add-gig"
              className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
              title="Add a new gig"
            >
              <PlusCircle size={20} />
            </Link>
            )}
            
            {currentUser && (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-lg shadow-lg border border-border z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-medium truncate">{currentUser.displayName || currentUser.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        to="/dashboard" 
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Buyer Dashboard
                      </Link>
                      
                      {isSeller && (
                        <Link 
                          to="/seller/dashboard" 
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Seller Dashboard
                        </Link>
                      )}
                    </div>
                    
                    <div className="border-t border-border py-1">
                      <button 
                        onClick={handleSignOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full bg-accent hover:bg-accent/80 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden glassmorphism mt-1 animate-fade-in">
          <div className="flex flex-col space-y-4 p-6">
            <Link 
              to="/explore" 
              onClick={closeMenu}
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/explore' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Explore
            </Link>
            <Link 
              to="/blog" 
              onClick={closeMenu}
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/blog' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Blog
            </Link>
            <Link 
              to="/contact" 
              onClick={closeMenu}
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/contact' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Contact
            </Link>
            {!currentUser && (
            <Link 
              to="/become-seller" 
              onClick={closeMenu}
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/become-seller' ? 'text-primary' : 'text-foreground/80'}`}
            >
              Become a Seller
            </Link>
            )}
            {currentUser && isSeller && (
              <Link 
                to="/seller/dashboard" 
                onClick={closeMenu}
                className={`font-medium transition-colors hover:text-primary ${location.pathname === '/seller/dashboard' ? 'text-primary' : 'text-foreground/80'}`}
              >
                Seller Dashboard
              </Link>
            )}
            <div className="pt-2 border-t border-border">
              {!currentUser ? (
                <>
              <Link 
                to="/signin" 
                onClick={closeMenu}
                className="block w-full mb-2 text-center py-2 font-medium transition-colors hover:text-primary"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                onClick={closeMenu}
                className="block w-full text-center py-2 btn-primary"
              >
                Sign Up
              </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMenu}
                    className="block w-full mb-2 text-center py-2 font-medium transition-colors hover:text-primary"
                  >
                    Buyer Dashboard
                  </Link>
                  {isSeller && (
                    <Link 
                      to="/seller/dashboard" 
                      onClick={closeMenu}
                      className="block w-full mb-2 text-center py-2 font-medium transition-colors hover:text-primary"
                    >
                      Seller Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      closeMenu();
                      handleSignOut();
                    }}
                    className="block w-full text-center py-2 text-destructive font-medium hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
