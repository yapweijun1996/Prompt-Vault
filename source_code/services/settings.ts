export interface Settings {
    apiKey: string;
    model: string;
}

const SETTINGS_KEY = 'promptVaultSettings';

const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    model: 'gemini-2.5-flash',
};

export const getSettings = (): Settings => {
    try {
        const settingsStr = localStorage.getItem(SETTINGS_KEY);
        if (settingsStr) {
            const storedSettings = JSON.parse(settingsStr);
            // Ensure we return a clean settings object with all expected properties.
            const settings: Settings = {
                apiKey: storedSettings.apiKey || DEFAULT_SETTINGS.apiKey,
                model: storedSettings.model || DEFAULT_SETTINGS.model,
            };
            return settings;
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
    }
    return { ...DEFAULT_SETTINGS };
};

export const saveSettings = (settings: Settings): void => {
    try {
        // Only save properties defined in the Settings interface.
        const settingsToSave: Settings = {
            apiKey: settings.apiKey,
            model: settings.model,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};
