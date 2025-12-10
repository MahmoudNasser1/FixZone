import React from 'react';

const SimpleCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-card dark:bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const SimpleCardHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
};

const SimpleCardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-card-foreground dark:text-card-foreground ${className}`}>
      {children}
    </h3>
  );
};

const SimpleCardContent = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent };
