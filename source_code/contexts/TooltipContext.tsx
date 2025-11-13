
import React, { createContext, useState, useCallback, ReactNode } from 'react';
import Tooltip from '../components/Tooltip';

interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipContextType {
  showTooltip: (content: string, position: TooltipPosition) => void;
  hideTooltip: () => void;
}

export const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });

  const showTooltip = useCallback((content: string, position: TooltipPosition) => {
    setTooltipContent(content);
    setTooltipPosition(position);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipContent(null);
  }, []);

  const value = { showTooltip, hideTooltip };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {tooltipContent && <Tooltip content={tooltipContent} position={tooltipPosition} />}
    </TooltipContext.Provider>
  );
};
