import React from 'react';

interface ComparisonModeToggleProps {
  useSlider: boolean;
  onToggle: (useSlider: boolean) => void;
}

const ComparisonModeToggle: React.FC<ComparisonModeToggleProps> = ({
  useSlider,
  onToggle,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 p-1 glass-panel rounded-lg">
      {/* Hold-to-Peek Button */}
      <button
        onClick={() => onToggle(false)}
        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
          !useSlider
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-300'
        }`}
        title="Hold button to see original"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Hold to Peek
      </button>

      {/* Comparison Slider Button */}
      <button
        onClick={() => onToggle(true)}
        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
          useSlider
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-300'
        }`}
        title="Drag slider to compare"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Slider
      </button>
    </div>
  );
};

export default ComparisonModeToggle;
