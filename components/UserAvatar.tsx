/**
 * UserAvatar Component
 * Displays a circular avatar with user's initials
 */

import React from 'react';

interface UserAvatarProps {
  email: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Get initials from email address
 * Examples:
 * - john.doe@gmail.com -> JD
 * - alice@example.com -> A
 * - bob.smith.jones@company.com -> BJ
 */
function getInitials(email: string): string {
  if (!email) return '?';
  
  // Get the part before @
  const username = email.split('@')[0];
  
  // Split by dots, hyphens, or underscores
  const parts = username.split(/[._-]/);
  
  if (parts.length >= 2) {
    // Take first letter of first and last part
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    // Take first two letters
    return parts[0].substring(0, 2).toUpperCase();
  } else {
    // Fallback to first letter
    return parts[0][0].toUpperCase();
  }
}

/**
 * Generate a consistent color based on email
 * This ensures the same email always gets the same color
 */
function getAvatarColor(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-orange-500',
  ];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  email, 
  size = 'md',
  onClick 
}) => {
  const initials = getInitials(email);
  const bgColor = getAvatarColor(email);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${bgColor}
        rounded-full
        flex items-center justify-center
        text-white font-semibold
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        select-none
      `}
      title={email}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
