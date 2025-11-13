
import React from 'react';

interface TooltipProps {
  content: string;
  position: { x: number; y: number };
}

const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  return (
    <div
      className="fixed z-50 px-3 py-1.5 text-sm font-medium text-white bg-slate-950 rounded-md shadow-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'none', // 确保工具提示不会干扰下方的鼠标事件
      }}
    >
      {content}
    </div>
  );
};

export default Tooltip;
