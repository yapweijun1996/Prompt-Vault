
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
      let allPrompts = await db.getAllPrompts();

      // 如果数据库为空，尝试从 prompts.json 加载默认提示
      if (allPrompts.length === 0) {
        try {
          const response = await fetch('/prompts.json');
          if (response.ok) {
            const defaultPrompts: PromptTemplate[] = await response.json();
            
            for (const prompt of defaultPrompts) {
              // 在保存到数据库前，移除 id 和时间戳，确保它们被当作新条目创建
              const { id, createdAt, updatedAt, ...promptToSave } = prompt;
              await db.savePrompt(promptToSave);
            }
            
            addToast(`已加载 ${defaultPrompts.length} 个默认提示模板。`, "success");
            
            // 从数据库重新加载提示
            allPrompts = await db.getAllPrompts();
          } else {
            if (response.status !== 404) {
              console.warn(`获取 prompts.json 失败: ${response.statusText}`);
            }
          }
        } catch (fetchError) {
          // 如果 fetch 失败（例如网络错误），也是正常的，静默处理
          console.info("无法从 prompts.json 加载默认提示模板", fetchError);
        }
      }

      setPrompts(allPrompts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } catch (error) {
      console.error("加载提示失败:", error);
      addToast("从数据库加载提示失败。", "error");
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
      // 如果是新提示，找到它的 ID 并选中
      if (!promptToSave.id) {
        const allPrompts = await db.getAllPrompts();
        const saved = allPrompts.find(p => p.title === promptToSave.title && p.content === promptToSave.content);
        if (saved) {
          setSelectedPromptId(saved.id);
        }
      }
      setIsNewPrompt(false);
    } catch (error) {
      console.error("保存提示失败:", error);
      addToast("保存提示失败。", "error");
    }
  }, [loadPrompts, addToast]);
  
  const handleDeleteRequest = useCallback((id: number) => {
    setDeleteConfirmationId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmationId === null) return;

    try {
      await db.deletePrompt(deleteConfirmationId);
      // 如果删除的是当前正在查看的提示，则重置视图
      if (selectedPromptId === deleteConfirmationId) {
        setSelectedPromptId(null);
        setIsNewPrompt(false);
      }
      setDeleteConfirmationId(null); // 关闭模态框
      await loadPrompts();
      addToast("提示已成功删除。", "success");
    } catch (error) {
      console.error("删除提示失败:", error);
      addToast("删除提示失败。", "error");
      setDeleteConfirmationId(null); // 出错时也关闭模态框
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
      console.error("导出提示失败:", error);
      addToast("导出为 JSON 失败。", "error");
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
        addToast(`成功导入 ${importedPrompts.length} 个提示！`, 'success');
      } catch (error) {
        console.error("导入提示失败:", error);
        addToast("导入失败。请检查文件格式。", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
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
      console.error("导出 HTML 失败:", error);
      addToast("导出为 HTML 失败。", "error");
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
                  placeholder="搜索提示..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>正在加载提示...</p>
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
        title="删除提示"
        message="您确定要删除此提示吗？此操作无法撤销。"
      />
    </div>
  );
};

export default App;
