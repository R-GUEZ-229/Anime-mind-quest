
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, color = 'bg-red-500' }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
