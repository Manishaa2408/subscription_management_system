import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login({ email: email.trim(), password });

      // Role-based redirect
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'staff':
          navigate('/staff/dashboard', { replace: true });
          break;
        case 'customer':
        default:
          navigate('/customer/dashboard', { replace: true });
          break;
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Brightloop Software account"
    >
      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email Address
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="email"
              className="form-input has-left-icon"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem',
            }}
          >
            <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input has-left-icon has-right-icon"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="spinner" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div
        style={{
          marginTop: '1.75rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--slate-500)',
        }}
      >
        Don't have an account?{' '}
        <Link to="/register" style={{ fontWeight: 600 }}>
          Create Customer Account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
