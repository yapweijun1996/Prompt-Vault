import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PromptTemplate } from '../types';
import { SaveIcon, DeleteIcon, RefactorIcon, ApplyIcon, DiscardIcon, AutoFillIcon } from './icons';
import { GoogleGenAI, Type } from '@google/genai';
import { getSettings } from '../services/settings';
import { useToast } from '../hooks/useToast';

interface PromptEditorProps {
  prompt: (Omit<PromptTemplate, 'id'> & { id?: number }) | null;
  onSave: (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }) => void;
  onDelete: (id: number) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tags: '',
    content: ''
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [refactoredContentSuggestion, setRefactoredContentSuggestion] = useState<string | null>(null);
  
  const initialPromptRef = useRef(prompt);
  const { addToast } = useToast();

  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        category: prompt.category,
        tags: prompt.tags.join(', '),
        content: prompt.content,
      });
      initialPromptRef.current = prompt;
      setIsDirty(false);
      setRefactoredContentSuggestion(null); // Clear suggestion when prompt changes
    }
  }, [prompt]);

  const handleDebouncedSave = useCallback(() => {
    if (!isDirty || !prompt) return;
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({ id: prompt?.id, ...formData, tags: tagsArray });
    setIsDirty(false); // Reset dirty state after save
  }, [formData, onSave, prompt, isDirty]);

  useEffect(() => {
    const handler = setTimeout(() => {
        handleDebouncedSave();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [formData, handleDebouncedSave]);

  const handleRefactor = async () => {
    if (!formData.content) return;

    const settings = getSettings();
    if (!settings.apiKey) {
      addToast("Please set your Gemini API key in the settings.", 'warning');
      return;
    }

    setIsRefactoring(true);
    setRefactoredContentSuggestion(null);
    try {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      const modelToUse = settings.model || 'gemini-2.5-flash';

const refactorPrompt = `
You are rewriting a rough idea into a clear message that I can send directly to a software engineer.

Follow this structure and style EXACTLY, using Markdown:

1) Start with a short intro section:
- 1–2 short paragraphs:
  - Paragraph 1: what I want to achieve (high-level goal).
  - Paragraph 2: current situation / problem (why this is needed).

2) Then add a Markdown heading:
## What I’d like you to do

3) Under that heading, write a step-by-step list using Markdown bullet points:
- Use short lines like:
  - Scan the codebase for ...
  - Refactor ...
  - Update usages ...
- You may use nested bullet points if helpful, but keep them simple.

4) Then add another Markdown heading:
## Constraints / preferences

5) Under that heading, list the constraints and preferences as Markdown bullet points.

6) End with one closing sentence in plain text, for example:
Let’s start with the most important parts first, get the pattern right, and then we can iterate.

IMPORTANT RULES:
- Do NOT output explanations about what you are doing.
- Do NOT mention the "original text".
- You MUST use Markdown headings (##) and bullet characters (-).
- Use simple, direct English, like in the SVG icon example.

Now rewrite this into that format:

${formData.content}
`;

      const response = await ai.models.generateContent({
          model: modelToUse,
          contents: refactorPrompt,
      });
      
      const refactoredContent = response.text;

      if (refactoredContent) {
        setRefactoredContentSuggestion(refactoredContent.trim());
      } else {
        addToast("Failed to refactor prompt. The model returned an empty response.", 'error');
      }
    } catch (error) {
      console.error("Failed to refactor prompt:", error);
      if (error instanceof Error && error.message.includes('API key not valid')) {
          addToast("Refactoring failed: Invalid API key. Please check your settings.", 'error');
      } else {
          addToast("An error occurred during refactoring. Please try again.", 'error');
      }
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleAutoFill = async () => {
    if (!formData.content) return;

    const settings = getSettings();
    if (!settings.apiKey) {
      addToast("Please set your Gemini API key in the settings.", 'warning');
      return;
    }

    setIsAutoFilling(true);
    try {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey });
      const modelToUse = settings.model || 'gemini-2.5-flash';

      const autoFillPrompt = `Analyze the following prompt and generate a suitable title, a category, and an array of relevant tags.

Prompt:
---
${formData.content}
---

Return the result as a JSON object with the keys "title", "category", and "tags".`;

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: autoFillPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A concise and descriptive title for the prompt." },
              category: { type: Type.STRING, description: "The primary category this prompt belongs to (e.g., 'Code Generation', 'Creative Writing')." },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 3-5 relevant keywords or tags."
              },
            },
            required: ["title", "category", "tags"],
          },
        },
      });

      const resultText = response.text.trim();
      const resultJson = JSON.parse(resultText);

      if (resultJson && resultJson.title && resultJson.category && Array.isArray(resultJson.tags)) {
        setFormData(prev => ({
          ...prev,
          title: resultJson.title,
          category: resultJson.category,
          tags: resultJson.tags.join(', '),
        }));
        setIsDirty(true);
      } else {
        addToast("Failed to auto-fill. The model returned an unexpected format.", 'error');
      }
    } catch (error) {
      console.error("Failed to auto-fill:", error);
      if (error instanceof Error && error.message.includes('API key not valid')) {
        addToast("Auto-fill failed: Invalid API key. Please check your settings.", 'error');
      } else {
        addToast("An error occurred during auto-fill. Please try again.", 'error');
      }
    } finally {
      setIsAutoFilling(false);
    }
  };


  const handleApplyRefactor = () => {
    if (refactoredContentSuggestion) {
        setFormData(prev => ({...prev, content: refactoredContentSuggestion}));
        setIsDirty(true);
        setRefactoredContentSuggestion(null);
    }
  };

  const handleDiscardRefactor = () => {
      setRefactoredContentSuggestion(null);
  };


  if (!prompt) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <p>Select a prompt to edit or create a new one.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };
  
  const handleManualSave = () => {
    if (!prompt) {
      addToast("Cannot save: no prompt is selected.", "error");
      return;
    }
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({ id: prompt.id, ...formData, tags: tagsArray });
    setIsDirty(false);
    addToast('Prompt saved!', 'success');
  }

  const handleDelete = () => {
    if (!prompt?.id) {
      addToast("Cannot delete: This is a new, unsaved prompt.", "warning");
      return;
    }
    onDelete(prompt.id);
  };

  const isSuggestionActive = refactoredContentSuggestion !== null;
  const isUiLocked = isSuggestionActive || isAutoFilling || isRefactoring;

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{prompt.id ? 'Edit Prompt' : 'New Prompt'}</h2>
        <div className="flex items-center gap-2">
          {isDirty && !isSuggestionActive && !isAutoFilling && <span className="text-sm text-slate-400 italic">Saving...</span>}
          <button
            onClick={handleManualSave}
            disabled={isUiLocked}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SaveIcon /> Save
          </button>
          {prompt.id && (
            <button
              onClick={handleDelete}
              disabled={isUiLocked}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <DeleteIcon /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-400 mb-1">Title</label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isUiLocked}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-700"
            placeholder="e.g., Generate React Component"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Category</label>
          <input
            type="text"
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isUiLocked}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-700"
            placeholder="e.g., Code Generation"
          />
        </div>
      </div>

      <div className="flex-shrink-0">
        <label htmlFor="tags" className="block text-sm font-medium text-slate-400 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          id="tags"
          value={formData.tags}
          onChange={handleChange}
          disabled={isUiLocked}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-700"
          placeholder="e.g., react, typescript, frontend"
        />
      </div>

      <div className="flex-grow flex flex-col relative">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="content" className="block text-sm font-medium text-slate-400">Prompt Content</label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefactor}
              disabled={!formData.content || isUiLocked}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <RefactorIcon /> {isRefactoring ? 'Refactoring...' : 'Refactor'}
            </button>
            <button
              onClick={handleAutoFill}
              disabled={!formData.content || isUiLocked}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-sky-300 font-semibold py-1 px-2 rounded-md text-xs transition-colors duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <AutoFillIcon />
              {isAutoFilling ? 'Generating...' : 'Auto-fill'}
            </button>
          </div>
        </div>
        <textarea
          name="content"
          id="content"
          value={formData.content}
          onChange={handleChange}
          disabled={isUiLocked}
          className="w-full h-full flex-grow bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono disabled:bg-slate-700"
          placeholder="Enter your prompt template here..."
        />
        {isSuggestionActive && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col p-4 rounded-md border border-slate-700">
                <p className="text-sm font-semibold text-sky-300 mb-2">Refactor Suggestion:</p>
                <div className="flex-grow bg-slate-800 border border-slate-600 rounded-md p-3 text-sm font-mono whitespace-pre-wrap overflow-y-auto">
                    {refactoredContentSuggestion}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={handleDiscardRefactor} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200">
                        <DiscardIcon /> Discard
                    </button>
                    <button onClick={handleApplyRefactor} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200">
                        <ApplyIcon /> Apply Changes
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;