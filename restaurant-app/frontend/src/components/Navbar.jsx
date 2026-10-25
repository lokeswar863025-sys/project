import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, UtensilsCrossed, Calendar, User, LogOut, ArrowRight, ShoppingBag, QrCode, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Menu', path: '/menu' },
  { name: 'Book a Table', path: '/book' },
  { name: 'History', path: '/orders' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'About', path: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const loginRef = useRef(null);

  // Scroll listener for sticky navbar transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for Login dropdown & User menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Escape listener & scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setLoginDropdownOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setLoginDropdownOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0f141c]/95 backdrop-blur-md border-b border-[#2d3748] py-3.5 shadow-2xl'
          : 'bg-gradient-to-b from-[#0f141c]/90 via-[#0f141c]/60 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d97706] to-[#f59e0b] flex items-center justify-center text-white shadow-lg shadow-[#f59e0b]/25 group-hover:shadow-[#f59e0b]/40 transition-all duration-300"
            >
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-wider text-white font-mono group-hover:text-[#f59e0b] transition-colors">
                NO-WAIT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] -mt-1 font-sans">
                Fine Dining
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#161c26]/90 p-1.5 rounded-full border border-[#2d3748] backdrop-blur-md shadow-inner">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full ${
                    isActive ? 'text-white font-bold' : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#2d3748] rounded-full border border-[#f59e0b]/50 -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Top-Right Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1e2532] border border-[#2d3748] hover:border-[#f59e0b]/50 transition-colors cursor-pointer"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-[#f59e0b]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#f59e0b] text-white font-bold text-xs flex items-center justify-center">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">
                    {user.displayName?.split(' ')[0] || 'Member'}
                  </span>
                </button>

                {/* Authenticated Customer Dropdown */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#161c26] border border-[#2d3748] rounded-2xl p-2 shadow-2xl z-50 font-mono text-xs space-y-1"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-[#1e2532] hover:text-[#f59e0b] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#f59e0b]" />
                        My Profile & Account
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-[#1e2532] hover:text-[#f59e0b] transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#f59e0b]" />
                        My Orders
                      </Link>

                      <Link
                        to="/reservations"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-[#1e2532] hover:text-emerald-400 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        My Reservations
                      </Link>

                      <div className="pt-1 border-t border-[#2d3748]">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {/* Single Top-Right Login Button with Dropdown (Customer Login / Owner Login) */}
                <div className="relative" ref={loginRef}>
                  <button
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1e2532] hover:bg-[#283244] border border-[#2d3748] hover:border-[#f59e0b]/50 rounded-full transition-all cursor-pointer shadow-sm"
                  >
                    <User className="w-4 h-4 text-[#f59e0b]" />
                    <span>Login</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-200 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {loginDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 mt-2 w-52 bg-[#161c26] border border-[#2d3748] rounded-2xl p-2 shadow-2xl z-50 text-xs font-mono space-y-1"
                      >
                        <Link
                          to="/login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-[#1e2532] hover:text-[#f59e0b] transition-all"
                        >
                          <User className="w-4 h-4 text-[#f59e0b] shrink-0" />
                          <div>
                            <div className="text-sm font-bold">Customer Login</div>
                            <div className="text-[10px] text-[#94a3b8]">Diner & Reservations</div>
                          </div>
                        </Link>

                        <Link
                          to="/owner/login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-[#1e2532] hover:text-[#f59e0b] transition-all"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-sm font-bold">Owner Login</div>
                            <div className="text-[10px] text-[#94a3b8]">Restaurant Admin Panel</div>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/book"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white font-extrabold text-sm shadow-md shadow-[#f59e0b]/25 hover:shadow-lg hover:shadow-[#f59e0b]/40 transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Now
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-[#1e2532] border border-[#2d3748] text-white hover:text-[#f59e0b] hover:border-[#f59e0b]/40 transition-all focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6 text-[#f59e0b]" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[72px] left-4 right-4 z-50 bg-[#161c26] border border-[#2d3748] rounded-3xl p-6 shadow-2xl md:hidden max-h-[85vh] overflow-y-auto font-mono"
            >
              <div className="flex flex-col gap-2">
                
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1e2532] border border-[#2d3748] mb-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-[#f59e0b]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white font-bold text-sm flex items-center justify-center">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{user.displayName}</div>
                      <div className="text-[11px] text-[#94a3b8] truncate max-w-[180px]">{user.mobile}</div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-wider mb-2 px-3">
                  NAVIGATION MENU
                </div>

                {NAV_LINKS.map((link, idx) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${
                          isActive
                            ? 'bg-[#1e2532] text-[#f59e0b] border border-[#f59e0b]/40 font-bold'
                            : 'text-[#94a3b8] hover:bg-[#1e2532] hover:text-white'
                        }`}
                      >
                        <span>{link.name}</span>
                        {isActive && <ArrowRight className="w-4 h-4 text-[#f59e0b]" />}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="pt-4 mt-2 border-t border-[#2d3748] flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1e2532] border border-[#2d3748] text-white font-semibold text-xs"
                      >
                        <User className="w-4 h-4 text-[#f59e0b]" /> Profile & Dashboard
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1e2532] border border-[#2d3748] text-white font-semibold text-xs"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#f59e0b]" /> My Orders
                      </Link>

                      <Link
                        to="/reservations"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1e2532] border border-[#2d3748] text-white font-semibold text-xs"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400" /> My Reservations
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-3.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-wider px-3 pt-2">
                        AUTHENTICATION OPTIONS
                      </div>
                      
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#1e2532] border border-[#2d3748] text-white font-semibold"
                      >
                        <User className="w-4 h-4 text-[#f59e0b]" />
                        <span>Customer Login</span>
                      </Link>

                      <Link
                        to="/owner/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#1e2532] border border-[#2d3748] text-white font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Owner Login</span>
                      </Link>

                      <Link
                        to="/book"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-center py-3.5 rounded-2xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white font-extrabold shadow-lg shadow-[#f59e0b]/30 mt-2"
                      >
                        Book Now
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
