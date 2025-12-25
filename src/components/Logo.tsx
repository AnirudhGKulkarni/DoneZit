import React from 'react';

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10', alt = 'Taskify logo' }) => {
  // Render plain image (no wrapper). Parent controls alignment and spacing.
  return <img src="/logo.png" alt={alt} className={`${className} object-contain mx-auto`} />;
};

export default Logo;
