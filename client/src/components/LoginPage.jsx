import { useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

/**
 * LoginPage — JWT authentication form with registration toggle.
 */
export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate registration fields
    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      const data = isRegister
        ? await apiRegister(username, password)
        : await apiLogin(username, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setConfirmPassword('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="glass-card login-card">
          <div className="login-logo">
            <h1>☁️ CloudVigil</h1>
            <p>API Monitoring & Analytics Dashboard</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="form-group" style={{ animation: 'fadeInUp 0.3s ease' }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading
                ? (isRegister ? 'Creating Account...' : 'Authenticating...')
                : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="auth-toggle">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button type="button" className="auth-toggle-btn" onClick={toggleMode}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
