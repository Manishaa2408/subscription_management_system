import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import AuthLayout from '../../components/auth/AuthLayout';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length > 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    match: password && password === confirmPassword,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.special) {
      setErrorMessage('Password does not meet all security criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword(token, {
        password,
        confirmPassword,
      });

      setSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.message || 'The password reset token is invalid or has expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Ensure your new password meets the security requirements"
    >
      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {success ? (
        <div style={{ textAlign: 'center' }}>
          <div className="alert alert-success" style={{ justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
            <span>Password has been reset successfully!</span>
          </div>

          <p style={{ color: 'var(--slate-600)', margin: '1.5rem 0', fontSize: '0.9rem' }}>
            You can now log in to Brightloop Software with your new credentials.
          </p>

          <Link to="/login" className="btn btn-primary">
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">
              New Password *
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-left-icon has-right-icon"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
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

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">
              Confirm New Password *
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input has-left-icon has-right-icon"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Requirements Guide */}
          <div className="password-requirements">
            <p>Password Requirements:</p>
            <div className={`requirement-item ${passwordChecks.length ? 'valid' : ''}`}>
              {passwordChecks.length ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>More than 8 characters</span>
            </div>
            <div className={`requirement-item ${passwordChecks.uppercase ? 'valid' : ''}`}>
              {passwordChecks.uppercase ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>At least one uppercase letter (A-Z)</span>
            </div>
            <div className={`requirement-item ${passwordChecks.lowercase ? 'valid' : ''}`}>
              {passwordChecks.lowercase ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>At least one lowercase letter (a-z)</span>
            </div>
            <div className={`requirement-item ${passwordChecks.special ? 'valid' : ''}`}>
              {passwordChecks.special ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>At least one special character (!@#$%^&*...)</span>
            </div>
            {confirmPassword && (
              <div className={`requirement-item ${passwordChecks.match ? 'valid' : ''}`}>
                {passwordChecks.match ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1.25rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Updating Password...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
