import React from 'react';
import { Layers } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Layers size={24} />
          </div>
          <span className="auth-brand-title">Brightloop Software</span>
        </div>

        <div className="auth-header">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
