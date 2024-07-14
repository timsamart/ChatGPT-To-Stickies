import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Unable to copy to clipboard', err);
  }
  document.body.removeChild(textArea);
}

function copyToClipboard(content: string) {
  if (window.isSecureContext && typeof navigator?.clipboard?.writeText === 'function') {
    navigator.clipboard.writeText(content);
  } else {
    unsecuredCopyToClipboard(content);
  }
}

function App() {
  const [input, setInput] = React.useState("");
  const [maxCol, setMaxCol] = React.useState(3);
  const [format, setFormat] = React.useState("plain");
  const [isLoading, setIsLoading] = React.useState(false);
  const [createSection, setCreateSection] = React.useState(true);

  React.useEffect(() => {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === "export-data") {
        const dataStr = JSON.stringify(message.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'stickies_data.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        setIsLoading(false);
      } else if (message.type === "creation-complete") {
        setIsLoading(false);
      }
    }
  }, []);

  

  const onCreateStickies = () => {
    setIsLoading(true);
    parent.postMessage(
      { pluginMessage: { type: "process-input", input, maxCol, format, createSection } },
      "*"
    );
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleMaxColChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setMaxCol(isNaN(value) ? 1 : Math.max(1, Math.min(10, value)));
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(event.target.value);
  };

  const handleCreateSectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCreateSection(event.target.checked);
  };

  const handleUndo = () => {
    parent.postMessage({ pluginMessage: { type: "undo" } }, "*");
  };

  const handleExport = () => {
    setIsLoading(true);
    parent.postMessage({ pluginMessage: { type: "export" } }, "*");
  };

  const copyPromptToClipboard = () => {
    const prompt = `Format the input data into a JSON object following these guidelines:

1. Organize the data into meaningful top-level categories.
2. For each category, create an array of objects with "title" and "content" keys.
3. Use the following JSON structure:

{
  "<emoji> Category 1": [
    {"title": "<emoji> Sticky Note 1", "content": "Content 1"},
    {"title": "<emoji> Sticky Note 2", "content": "Content 2"}
  ],
  "<emoji> Category 2": [
    {"title": "<emoji> Sticky Note 3", "content": "Content 3"},
    {"title": "<emoji> Sticky Note 4", "content": "Content 4"}
  ]
}

4. Replace <emoji> with a relevant emoji that represents the category or sticky note content. For example, use 🌍 for geography, 📊 for statistics, or 🧪 for science.

Parse and format the following JSON data according to these instructions:

<data>

</data>`;

    copyToClipboard(prompt);
    parent.postMessage({ 
      pluginMessage: { 
        type: "show-notification", 
        message: "Prompt copied to clipboard!",
        options: {
          timeout: 2000,
          button: {
            text: "View Prompt",
            action: "view-prompt"
          }
        }
      } 
    }, "*");
  };

  const getPlaceholder = () => {
    switch (format) {
      case "plain":
        return "Title 1: Content 1\nTitle 2: Content 2...";
      case "json":
        return '{\n  "Section 1": [\n    {"title": "Sticky 1", "content": "Content 1"},\n    {"title": "Sticky 2", "content": "Content 2"}\n  ],\n  "Section 2": [\n    {"title": "Sticky 3", "content": "Content 3"},\n    {"title": "Sticky 4", "content": "Content 4"}\n  ]\n}';
      default:
        return "";
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📝 Stickies Creator</h1>
      </header>
      <main className="app-main">
        <div className="input-group">
          <label htmlFor="format">Input Format</label>
          <select id="format" value={format} onChange={handleFormatChange} className="select-input">
            <option value="unstructured-json">Unstructured JSON</option>
            <option value="json">Structured JSON</option>
            <option value="plain">Plain Text</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="input">Input Data</label>
          <textarea
            id="input"
            value={input}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            className="textarea-input"
            rows={10}
          />
        </div>
        <div className="input-group">
          <label htmlFor="maxColumns">Max Columns</label>
          <input
            id="maxColumns"
            type="number"
            min="1"
            max="10"
            value={maxCol}
            onChange={handleMaxColChange}
            className="number-input"
          />
        </div>
        <div className="input-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={createSection}
              onChange={handleCreateSectionChange}
              className="checkbox-input"
            />
            Create Section
          </label>
        </div>
        <button className="button button-secondary" onClick={copyPromptToClipboard}>
          📋 Copy Formatting Prompt
        </button>
      </main>
      <footer className="app-footer">
        <button className="button button-primary" onClick={onCreateStickies} disabled={!input.trim() || isLoading}>
          {isLoading ? 'Creating...' : '📋 Create Stickies'}
        </button>
        <div className="button-group">
          <button className="button button-secondary" onClick={handleUndo} disabled={isLoading}>
            ↩️ Undo
          </button>
          <button className="button button-secondary" onClick={handleExport} disabled={isLoading}>
            📤 Export
          </button>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")!).render(<App />);