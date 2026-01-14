import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-10'
  };

  const colClasses = `
    grid
    grid-cols-${cols.mobile || 1}
    ${cols.tablet ? `sm:grid-cols-${cols.tablet}` : ''}
    ${cols.desktop ? `lg:grid-cols-${cols.desktop}` : ''}
    ${gapClasses[gap]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={colClasses}>
      {children}
    </div>
  );
}

export function ResponsiveStack({ 
  children, 
  gap = 'md',
  className = ''
}: {
  children: ReactNode;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const gapClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
    xl: 'space-y-8 sm:space-y-10'
  };

  return (
    <div className={`${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}