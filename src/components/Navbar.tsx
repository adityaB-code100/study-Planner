import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type Theme = {
  accent: string;
  background: string;
  panel: string;
};

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  presets: Record<string, Theme>;
  user: any;
  onLogout: () => void;
};

const Navbar: React.FC<Props> = ({ theme, onThemeChange, presets, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false); // Close menu on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const presetButtons = (Object.entries(presets) as Array<[string, Theme]>).map(
    ([key, value]) => (
      <button
        key={key}
        type="button"
        className="preset-chip"
        onClick={() => onThemeChange(value)}
      >
        <span className="dot" style={{ background: value.accent }} />
        {key}
      </button>
    )
  );

  const handleLogout = () => {
    onLogout();
    navigate('/auth');
    setIsMenuOpen(false); // Close menu on logout
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="nav-neo">
      {/* Brand */}
      <Link to="/" className="brand" onClick={closeMenu}>
        <span className="emoji">🤖</span> Smart Study Co-Pilot
        {user && !isMobile && <span className="welcome-text">Welcome, {user.name}!</span>}
      </Link>

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button
          className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}

      <div className={`nav-right ${isMobile ? 'mobile' : ''} ${isMenuOpen ? 'open' : ''}`}>
        {/* AI Badge */}
        <div className="badge-ai">
          AI mock
          <span className="ping" />
        </div>

        {/* Theme Controls - Hide on mobile when menu is closed */}
        {(!isMobile || isMenuOpen) && (
          <div className="theme-controls">
            <label className="color-picker">
              Accent
              <input
                type="color"
                value={theme.accent}
                onChange={(e) =>
                  onThemeChange({ ...theme, accent: e.target.value })
                }
              />
            </label>

            <div className="preset-row">{presetButtons}</div>
          </div>
        )}

        {/* Navigation Links */}
        <div className={`nav-links ${isMobile ? 'mobile' : ''}`}>
          {user ? (
            <>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMenu}>
                Home
              </Link>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''} onClick={closeMenu}>
                Dashboard
              </Link>
              <Link to="/create-plan" className={location.pathname === '/create-plan' ? 'active' : ''} onClick={closeMenu}>
                Create Plan
              </Link>
              <Link to="/plan" className={location.pathname === '/plan' ? 'active' : ''} onClick={closeMenu}>
                View Plan
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={location.pathname === '/auth' ? 'active auth-btn' : 'auth-btn'}
              onClick={closeMenu}
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;