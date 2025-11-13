import { PromptTemplate } from '../types';

export const generateStaticHTML = (prompts: PromptTemplate[]): string => {
  const promptsJson = JSON.stringify(prompts, null, 2);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Vault - Static Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .prompt-card:target {
            border-color: #0ea5e9; /* sky-500 */
            box-shadow: 0 0 0 2px #0ea5e9;
        }
        html {
            scroll-behavior: smooth;
        }
        .prompt-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-in-out, margin-bottom 0.4s ease-in-out;
            margin-bottom: 0;
        }
        .prompt-content.show {
            max-height: 2000px; /* A large enough value to not clip content */
            margin-bottom: 1rem; /* mb-4 */
        }
    </style>
</head>
<body class="bg-slate-900 text-slate-200 font-sans">
    <div class="container mx-auto p-4 md:p-8">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Prompt Vault</h1>
            <p class="text-slate-400">A read-only collection of prompt templates.</p>
        </header>

        <div class="sticky top-0 bg-slate-900 py-4 z-10 mb-8">
            <input type="text" id="search-input" placeholder="Search prompts..." class="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
        </div>

        <main id="prompt-list" class="grid grid-cols-1 gap-6">
            <!-- Prompts will be rendered here -->
        </main>
    </div>

    <script type="application/json" id="prompt-data">
        ${promptsJson}
    </script>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const prompts = JSON.parse(document.getElementById('prompt-data').textContent);
            const promptList = document.getElementById('prompt-list');
            const searchInput = document.getElementById('search-input');

            const renderPrompts = (promptsToRender) => {
                if (!promptsToRender.length) {
                    promptList.innerHTML = '<p class="text-slate-500">No prompts found.</p>';
                    return;
                }

                promptList.innerHTML = promptsToRender.map(prompt => \`
                    <div id="prompt-\${prompt.id}" class="prompt-card bg-slate-800 rounded-lg border border-slate-700 p-6 transition duration-300 ease-in-out">
                        <div class="flex justify-between items-start gap-4 mb-4">
                            <div class="flex-grow">
                                <h2 class="text-xl font-semibold text-white">\${prompt.title}</h2>
                                <p class="text-sm text-sky-400">\${prompt.category || 'Uncategorized'}</p>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <button onclick="togglePrompt(this, 'prompt-content-\${prompt.id}')" class="toggle-btn bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
                                    Show
                                </button>
                                <button onclick="copyToClipboard(this, \`\${btoa(encodeURIComponent(prompt.content))}\`)" class="copy-btn bg-slate-700 hover:bg-sky-600 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div id="prompt-content-\${prompt.id}" class="prompt-content prose prose-invert prose-sm max-w-none text-slate-300">
                            <pre class="bg-slate-900/70 p-4 rounded-md whitespace-pre-wrap font-mono"><code>\${escapeHtml(prompt.content)}</code></pre>
                        </div>
                        \${prompt.tags && prompt.tags.length > 0 ? \`
                        <div class="flex flex-wrap gap-2">
                            \${prompt.tags.map(tag => \`<span class="bg-slate-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">\${tag}</span>\`).join('')}
                        </div>
                        \` : ''}
                    </div>
                \`).join('');
            };

            const filterPrompts = () => {
                const searchTerm = searchInput.value.toLowerCase();
                const filtered = prompts.filter(prompt =>
                    prompt.title.toLowerCase().includes(searchTerm) ||
                    prompt.category.toLowerCase().includes(searchTerm) ||
                    prompt.content.toLowerCase().includes(searchTerm) ||
                    prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
                );
                renderPrompts(filtered);
            };

            window.togglePrompt = (button, contentId) => {
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.toggle('show');
                    if (content.classList.contains('show')) {
                        button.textContent = 'Hide';
                    } else {
                        button.textContent = 'Show';
                    }
                }
            };

            window.copyToClipboard = (button, base64Content) => {
                try {
                    const content = decodeURIComponent(atob(base64Content));
                    navigator.clipboard.writeText(content).then(() => {
                        button.textContent = 'Copied!';
                        setTimeout(() => {
                            button.textContent = 'Copy';
                        }, 2000);
                    }, () => {
                        alert('Failed to copy');
                    });
                } catch (e) {
                    console.error('Error decoding content:', e);
                    alert('Failed to copy due to a decoding error.');
                }
            };
            
            window.escapeHtml = (unsafe) => {
                return unsafe
                     .replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
            }

            searchInput.addEventListener('input', filterPrompts);
            
            renderPrompts(prompts);
        });
    </script>
</body>
</html>
  `;
};
