import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time password requirement checks
  const passwordChecks = {
    length: formData.password.length > 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(formData.password),
    match: formData.password && formData.password === formData.confirmPassword,
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!passwordChecks.length) {
      setErrorMessage('Password must contain more than 8 characters.');
      return;
    }
    if (!passwordChecks.uppercase) {
      setErrorMessage('Password must contain at least one uppercase letter.');
      return;
    }
    if (!passwordChecks.lowercase) {
      setErrorMessage('Password must contain at least one lowercase letter.');
      return;
    }
    if (!passwordChecks.special) {
      setErrorMessage('Password must contain at least one special character.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Public registration auto-assigns customer role
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Customer Account"
      subtitle="Sign up for Brightloop Software subscription services"
    >
      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">
            Full Name *
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <User size={18} />
            </span>
            <input
              id="register-name"
              name="fullName"
              type="text"
              className="form-input has-left-icon"
              placeholder="e.g. Rahul Kumar"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">
            Email Address *
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={18} />
            </span>
            <input
              id="register-email"
              name="email"
              type="email"
              className="form-input has-left-icon"
              placeholder="rahul@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-phone">
            Phone Number (Optional)
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Phone size={18} />
            </span>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              className="form-input has-left-icon"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">
            Password *
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={18} />
            </span>
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input has-left-icon has-right-icon"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
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

        <div className="form-group">
          <label className="form-label" htmlFor="register-confirm-password">
            Confirm Password *
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={18} />
            </span>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-input has-left-icon has-right-icon"
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
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
          {formData.confirmPassword && (
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
              <span>Creating Account...</span>
            </>
          ) : (
            'Complete Registration'
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
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
