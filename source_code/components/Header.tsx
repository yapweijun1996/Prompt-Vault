
import React, { useRef } from 'react';
import { NewIcon, ImportIcon, ExportIcon, PublishIcon, SettingsIcon } from './icons';
import { useTooltip } from '../hooks/useTooltip';

interface HeaderProps {
  onNewPrompt: () => void;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewPrompt, onImportJson, onExportJson, onExportHtml, onOpenSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  // 为每个按钮创建工具提示处理器
  const newPromptTooltip = useTooltip('Create a new prompt');
  const importTooltip = useTooltip('Import from JSON (.json)');
  const exportTooltip = useTooltip('Export to JSON (.json)');
  const publishTooltip = useTooltip('Publish as a static HTML file');
  const settingsTooltip = useTooltip('Open settings');

  return (
    <header className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <h1 className="text-xl font-bold text-white">Prompt Vault</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          {...newPromptTooltip}
          onClick={onNewPrompt}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
        >
          <NewIcon />
          New Prompt
        </button>
        <input type="file" ref={fileInputRef} onChange={onImportJson} className="hidden" accept=".json" />
        <button {...importTooltip} onClick={handleImportClick} className="p-2 rounded-md hover:bg-slate-700 transition-colors duration-200"><ImportIcon /></button>
        <button {...exportTooltip} onClick={onExportJson} className="p-2 rounded-md hover:bg-slate-700 transition-colors duration-200"><ExportIcon /></button>
        <button {...publishTooltip} onClick={onExportHtml} className="p-2 rounded-md hover:bg-slate-700 transition-colors duration-200"><PublishIcon /></button>
        <div className="border-l border-slate-600 h-6 mx-2"></div>
        <button {...settingsTooltip} onClick={onOpenSettings} className="p-2 rounded-md hover:bg-slate-700 transition-colors duration-200"><SettingsIcon /></button>
      </div>
    </header>
  );
};

export default Header;
