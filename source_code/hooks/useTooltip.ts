
import { useContext } from 'react';
import { TooltipContext } from '../contexts/TooltipContext';

const TOOLTIP_OFFSET = 15; // 提示框相对于光标的偏移量

/**
 * 自定义 Hook，用于为组件生成工具提示的事件处理器。
 * @param content - 要在工具提示中显示的文本内容。
 * @returns 一个包含 onMouseMove 和 onMouseLeave 事件处理器的对象，可以解构到组件上。
 */
export const useTooltip = (content: string) => {
  const context = useContext(TooltipContext);

  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }

  const { showTooltip, hideTooltip } = context;

  const tooltipHandlers = {
    // onMouseMove 同时处理显示和更新工具提示的位置
    onMouseMove: (e: React.MouseEvent) => {
      showTooltip(content, { x: e.clientX + TOOLTIP_OFFSET, y: e.clientY + TOOLTIP_OFFSET });
    },
    // onMouseLeave 用于隐藏工具提示
    onMouseLeave: () => {
      hideTooltip();
    },
  };

  return tooltipHandlers;
};
