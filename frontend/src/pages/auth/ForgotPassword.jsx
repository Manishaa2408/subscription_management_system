import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import AuthLayout from '../../components/auth/AuthLayout';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setDevResetUrl('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(
        res?.message ||
          'If an account with that email exists, password reset instructions have been sent.'
      );

      // In development mode, display reset link for easy hackathon demo testing
      if (res?.data?.devResetToken) {
        setDevResetUrl(`/reset-password/${res.data.devResetToken}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a recovery link"
    >
      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div>{successMessage}</div>
            {devResetUrl && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.825rem' }}>
                <strong>Hackathon Dev Notice:</strong>
                <br />
                <Link
                  to={devResetUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#047857',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    marginTop: '0.25rem',
                  }}
                >
                  <KeyRound size={14} /> Open Reset Password Page Directly
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {!successMessage ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              Registered Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="forgot-email"
                type="email"
                className="form-input has-left-icon"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
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
                <span>Sending Instructions...</span>
              </>
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>
      ) : null}

      <div
        style={{
          marginTop: '1.75rem',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}
      >
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--slate-600)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
