import React from 'react';
import { PageHeader } from '../common/PageHeader';

export const PortalLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {title && (
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
      )}
      {children}
    </div>
  );
};

export default PortalLayout;
