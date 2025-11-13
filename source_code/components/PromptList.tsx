
import React from 'react';
import { PromptTemplate } from '../types';

interface PromptListProps {
  prompts: PromptTemplate[];
  selectedPromptId: number | null;
  onSelectPrompt: (id: number) => void;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, selectedPromptId, onSelectPrompt }) => {
  if (prompts.length === 0) {
    return <div className="p-4 text-center text-slate-500">No prompts found. Create one!</div>;
  }

  return (
    <nav className="flex-grow p-2">
      <ul>
        {prompts.map((prompt) => (
          <li key={prompt.id}>
            <button
              onClick={() => onSelectPrompt(prompt.id)}
              className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${
                selectedPromptId === prompt.id
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <h3 className="font-semibold truncate">{prompt.title || 'Untitled Prompt'}</h3>
              <p className="text-sm text-slate-400 truncate">{prompt.category || 'Uncategorized'}</p>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default PromptList;
