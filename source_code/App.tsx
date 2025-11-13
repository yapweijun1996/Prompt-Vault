
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptTemplate } from './types';
import * as db from './services/db';
import Header from './components/Header';
import PromptList from './components/PromptList';
import PromptEditor from './components/PromptEditor';
import SettingsModal from './components/SettingsModal';
import ConfirmationModal from './components/ConfirmationModal';
import { generateStaticHTML } from './services/htmlGenerator';
import { useToast } from './hooks/useToast';

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const { addToast } = useToast();

  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      await db.initDB();
      const allPrompts = await db.getAllPrompts();
      setPrompts(allPrompts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } catch (error) {
      console.error("Failed to load prompts:", error);
      addToast("Failed to load prompts from the database.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleNewPrompt = () => {
    setSelectedPromptId(null);
    setIsNewPrompt(true);
  };
  
  const handleSelectPrompt = (id: number) => {
    setSelectedPromptId(id);
    setIsNewPrompt(false);
  };

  const handleSavePrompt = useCallback(async (promptToSave: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }) => {
    try {
      await db.savePrompt(promptToSave);
      await loadPrompts();
      // If it was a new prompt, find its new ID and select it
      if (!promptToSave.id) {
        const allPrompts = await db.getAllPrompts();
        const saved = allPrompts.find(p => p.title === promptToSave.title && p.content === promptToSave.content);
        if (saved) {
          setSelectedPromptId(saved.id);
        }
      }
      setIsNewPrompt(false);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      addToast("Failed to save the prompt.", "error");
    }
  }, [loadPrompts, addToast]);
  
  const handleDeleteRequest = useCallback((id: number) => {
    setDeleteConfirmationId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmationId === null) return;

    try {
      await db.deletePrompt(deleteConfirmationId);
      // If the deleted prompt was the one being viewed, reset the view.
      if (selectedPromptId === deleteConfirmationId) {
        setSelectedPromptId(null);
        setIsNewPrompt(false);
      }
      setDeleteConfirmationId(null); // Close modal
      await loadPrompts();
      addToast("Prompt deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      addToast("Failed to delete prompt.", "error");
      setDeleteConfirmationId(null); // Close modal on error too
    }
  }, [deleteConfirmationId, selectedPromptId, loadPrompts, addToast]);

  const handleExportJson = async () => {
    try {
      const allPrompts = await db.getAllPrompts();
      const dataStr = JSON.stringify(allPrompts, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'prompts.json';
  
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Failed to export prompts:", error);
      addToast("Failed to export prompts as JSON.", "error");
    }
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        const importedPrompts = JSON.parse(text) as PromptTemplate[];
        
        for (const prompt of importedPrompts) {
          const { id, ...promptWithoutId } = prompt;
          await db.savePrompt(promptWithoutId);
        }
        await loadPrompts();
        addToast(`${importedPrompts.length} prompts imported successfully!`, 'success');
      } catch (error) {
        console.error("Failed to import prompts:", error);
        addToast("Failed to import prompts. Please check the file format.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
    
  const handleExportHtml = async () => {
    try {
      const allPrompts = await db.getAllPrompts();
      const htmlContent = generateStaticHTML(allPrompts);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = 'prompt-vault.html';
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export HTML:", error);
      addToast("Failed to export prompts as HTML.", "error");
    }
  };

  const selectedPrompt = useMemo((): (Omit<PromptTemplate, 'id'> & { id?: number }) | null => {
    if (isNewPrompt) {
      return { title: '', category: '', tags: [], content: '', createdAt: new Date(), updatedAt: new Date() };
    }
    return prompts.find(p => p.id === selectedPromptId) || null;
  }, [selectedPromptId, prompts, isNewPrompt]);

  const filteredPrompts = useMemo(() => {
    if (!searchTerm) return prompts;
    const lowercasedFilter = searchTerm.toLowerCase();
    return prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(lowercasedFilter) ||
      prompt.category.toLowerCase().includes(lowercasedFilter) ||
      prompt.content.toLowerCase().includes(lowercasedFilter) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
    );
  }, [prompts, searchTerm]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <Header
        onNewPrompt={handleNewPrompt}
        onImportJson={handleImportJson}
        onExportJson={handleExportJson}
        onExportHtml={handleExportHtml}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
        <div className="col-span-1 border-r border-slate-700 flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading prompts...</p>
            </div>
          ) : (
            <PromptList
              prompts={filteredPrompts}
              selectedPromptId={selectedPromptId}
              onSelectPrompt={handleSelectPrompt}
            />
          )}
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3 h-full overflow-y-auto">
          <PromptEditor
            key={selectedPrompt?.id || 'new'}
            prompt={selectedPrompt}
            onSave={handleSavePrompt}
            onDelete={handleDeleteRequest}
          />
        </div>
      </main>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <ConfirmationModal
        isOpen={deleteConfirmationId !== null}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
      />
    </div>
  );
};

export default App;
