
import { PromptTemplate } from '../types';

const DB_NAME = 'PromptVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'prompts';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = dbInstance.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
};

export const savePrompt = (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const now = new Date();
    let promptToSave: any;

    if (prompt.id) {
        // Update existing prompt
        const getRequest = store.get(prompt.id);
        getRequest.onsuccess = () => {
            const existingPrompt = getRequest.result;
            if (existingPrompt) {
                promptToSave = { ...existingPrompt, ...prompt, updatedAt: now };
                const putRequest = store.put(promptToSave);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                 reject('Prompt not found');
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    } else {
        // Add new prompt
        const { id, ...newPromptData } = prompt;
        promptToSave = { ...newPromptData, createdAt: now, updatedAt: now };
        const addRequest = store.add(promptToSave);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
    }
  });
};

export const getAllPrompts = (): Promise<PromptTemplate[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getPromptById = (id: number): Promise<PromptTemplate | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};


export const deletePrompt = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};
