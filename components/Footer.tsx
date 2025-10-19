import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-1 md:py-2 flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-xs text-gray-500">
          <span className="hidden md:inline">© {currentYear} AI Image Stylizer</span>
          <span className="md:hidden">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
