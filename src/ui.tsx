import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

function App() {
  const [input, setInput] = React.useState("");
  const [maxCol, setMaxCol] = React.useState(7);
  const [format, setFormat] = React.useState("plain");
  const [color, setColor] = React.useState("#FFFFFF");

  React.useEffect(() => {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === "export-data") {
        const dataStr = JSON.stringify(message.data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'stickies_data.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    }
  }, []);

  const onCreateStickies = () => {
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
    setMaxCol(isNaN(value) ? 1 : Math.max(1, value));
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
    parent.postMessage({ pluginMessage: { type: "export" } }, "*");
  };

  const getPlaceholder = () => {
    switch (format) {
      case "plain":
        return "Title1: Content1\nTitle2: Content2...";
      case "json":
        return '[{"title": "Title1", "content": "Content1"}, {"title": "Title2", "content": "Content2"}]';
      default:
        return "";
    }
  };

  return (
    <main>
      <header>
        <h2>📝 Multi-format Stickies Creator</h2>
      </header>
      <section>
        <h3>Input</h3>
        <label htmlFor="format">Input Format</label>
        <select id="format" value={format} onChange={handleFormatChange}>
          <option value="plain">Plain Text</option>
          <option value="json">JSON</option>
        </select>
        <label htmlFor="input">Input Data</label>
        <textarea
          id="input"
          value={input}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          className="input-textarea"
        />
        <label htmlFor="maxColumns">Maximum Columns</label>
        <input
          id="maxColumns"
          type="number"
          min="1"
          value={maxCol}
          onChange={handleMaxColChange}
          className="max-col-input"
        />
        <label htmlFor="color">Sticky Color</label>
        <input
          id="color"
          type="color"
          value={color}
          onChange={handleColorChange}
        />
        <button className="brand" onClick={onCreateStickies} disabled={!input.trim()}>
          📋 Create Stickies
        </button>
        <button onClick={handleUndo}>↩️ Undo</button>
        <button onClick={handleExport}>📤 Export</button>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")!).render(<App />);