import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

function App() {
  const [input, setInput] = React.useState("");
  const [maxCol, setMaxCol] = React.useState(3);
  const [format, setFormat] = React.useState("plain");
  const [color, setColor] = React.useState("#FFF9DE");
  const [isLoading, setIsLoading] = React.useState(false);

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
      }
    }
  }, []);

  const onCreateStickies = () => {
    setIsLoading(true);
    parent.postMessage(
      { pluginMessage: { type: "process-input", input, maxCol, format, color } },
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

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value);
  };

  const handleUndo = () => {
    parent.postMessage({ pluginMessage: { type: "undo" } }, "*");
  };

  const handleExport = () => {
    setIsLoading(true);
    parent.postMessage({ pluginMessage: { type: "export" } }, "*");
  };

  const getPlaceholder = () => {
    switch (format) {
      case "plain":
        return "Title 1: Content 1\nTitle 2: Content 2...";
      case "json":
        return '{\n  "Frame 1": [\n    {"title": "Sticky 1", "content": "Content 1"},\n    {"title": "Sticky 2", "content": "Content 2"}\n  ],\n  "Frame 2": [\n    {"title": "Sticky 3", "content": "Content 3"},\n    {"title": "Sticky 4", "content": "Content 4"}\n  ]\n}';
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
            <option value="plain">Plain Text</option>
            <option value="json">JSON</option>
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
        <div className="input-row">
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
            <label htmlFor="color">Sticky Color</label>
            <input
              id="color"
              type="color"
              value={color}
              onChange={handleColorChange}
              className="color-input"
            />
          </div>
        </div>
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