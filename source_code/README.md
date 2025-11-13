# Prompt Vault

Prompt Vault is a powerful, locally-hosted web application designed to help you create, manage, and organize your prompt templates efficiently. It's a perfect tool for developers, writers, and anyone who frequently works with AI prompts. All data is stored directly in your browser, ensuring your prompts are private and secure.

The application also integrates with Google's Gemini AI to provide intelligent features like automatic prompt refactoring and metadata generation.

## ✨ Key Features

*   **📝 Full CRUD Operations:** Create, read, update, and delete your prompt templates with an intuitive interface.
*   **💾 Local First Storage:** All your data is stored securely in your browser's IndexedDB. No need for a backend server or an internet connection to manage your prompts.
*   **🔍 Powerful Search:** Instantly find any prompt by searching through its title, category, tags, or content.
*   **🤖 AI-Powered Enhancements (via Gemini):**
    *   **Refactor:** Automatically rewrite your rough ideas into clear, structured messages suitable for software engineers or other professionals.
    *   **Auto-fill:** Let AI analyze your prompt's content to automatically generate a fitting title, category, and relevant tags.
*   **🔄 Import & Export:**
    *   **JSON:** Easily back up your entire prompt library to a JSON file or import prompts from one.
    *   **Static HTML:** Export all your prompts into a single, self-contained HTML file for easy sharing and viewing anywhere.
*   **⚙️ Settings Configuration:** Configure your Gemini API key and preferred model directly within the application.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Bundler:** Vite
*   **Styling:** Tailwind CSS
*   **Database:** IndexedDB (via browser)
*   **AI:** Google Gemini AI (`@google/genai`)

## 🚀 Getting Started

Follow these steps to get the Prompt Vault running on your local machine.

### Prerequisites

*   Node.js (v18 or newer)
*   npm or a compatible package manager

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd prompt-vault
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will now be running at `http://localhost:5173` (or another port if 5173 is busy).

## 📖 How to Use

1.  **Create a New Prompt:** Click the "New Prompt" button to open the editor.
2.  **Fill in Details:** Write your prompt content. You can manually add a title, category, and tags, or use the AI features.
3.  **Auto-fill Metadata:** Click the **"Auto-fill"** button. If you have a valid Gemini API key configured, the AI will read your prompt and suggest a title, category, and tags for you.
4.  **Refactor Content:** Click the **"Refactor"** button to have the AI restructure your prompt content into a clearer, more actionable format. You can then review the suggestion and choose to apply or discard it.
5.  **Saving:** Changes are auto-saved periodically. You can also manually save by clicking the "Save" button.
6.  **Import/Export:** Use the header buttons to import from JSON or export your library to JSON or a static HTML file.

### Configuring the Gemini API Key

To use the "Refactor" and "Auto-fill" features, you need a Google Gemini API key.

1.  Click the **Settings** (gear) icon in the header.
2.  Enter your Gemini API key into the input field.
3.  (Optional) You can also specify which Gemini model you'd like to use.
4.  Close the settings modal. Your key is saved automatically to your browser's local storage.
