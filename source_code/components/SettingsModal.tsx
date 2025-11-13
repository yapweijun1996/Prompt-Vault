import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, Settings } from '../services/settings';
import { CloseIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 基于指南推荐的模型列表
const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-native-audio-preview-09-2025',
    'gemini-2.5-flash-preview-tts',
    'veo-3.1-fast-generate-preview',
    'imagen-4.0-generate-001',
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings>({ apiKey: '', model: MODELS[0] });

  useEffect(() => {
    if (isOpen) {
      const currentSettings = getSettings();
      setSettings(currentSettings);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    onClose();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
            <h2 id="settings-title" className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close settings">
              <CloseIcon />
            </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-400 mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={settings.apiKey}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter your API key"
              aria-label="Gemini API Key"
            />
            <p className="text-xs text-yellow-400 mt-1">
              <strong>Warning:</strong> Saving API keys in your browser is not secure. Use with caution.
            </p>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-400 mb-1">
              Model
            </label>
            <select
              id="model"
              name="model"
              value={settings.model}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Select a Gemini model"
            >
              {MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
             <p className="text-xs text-slate-500 mt-1">Your API key is stored in your browser's local storage.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
