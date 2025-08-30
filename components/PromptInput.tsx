import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled = false, maxLength = 600 }) => {
  const remaining = maxLength - value.length;
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-200">AI guidance (optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder="Describe what you want (e.g., warm sunset lighting, cinematic mood, pastel palette, add soft depth of field, etc.)"
        className="w-full min-h-[96px] max-h-64 p-3 glass-input text-gray-100 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span>These instructions will be combined with the selected style.</span>
        <span className={remaining < 50 ? 'text-yellow-300' : ''}>{remaining} chars left</span>
      </div>
    </div>
  );
};

export default PromptInput;
