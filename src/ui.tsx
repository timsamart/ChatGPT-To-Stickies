import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

declare function require(path: string): any;

function App() {
  const [notes, setNotes] = React.useState(""); // add state to handle the notes
  const [maxCol, setMaxCol] = React.useState(7); // add state to handle maxCol

  const onPasteAsNotes = () => {
    parent.postMessage(
      { pluginMessage: { type: "notes", notes, maxCol: maxCol } },
      "*"
    );
  };

  const handleNoteChange = (event) => {
    setNotes(event.target.value); // update the state when text changes
  };

  const handleMaxColChange = (event) => {
    setMaxCol(event.target.value); // update the state when maxCol changes
  };

  return (
    <main>
      <header>
        <h1>📝 ChatGPT to Stickies</h1>
        <img
          src={require("./logo.svg")}
          className="logo"
          alt="Logo"
          style={{ width: "30px", height: "30px" }}
        />
      </header>
      <section>
        <h2>Input</h2>
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={handleNoteChange}
          placeholder="Paste your notes here"
          className="note-textarea"
        />
        <label htmlFor="maxColumns">Maximum Columns</label>
        <input
          id="maxColumns"
          type="number"
          min="1"
          value={maxCol}
          onChange={handleMaxColChange}
          placeholder="Max Columns"
          className="max-col-input"
        />
        <button className="brand" onClick={onPasteAsNotes}>
          📋 Paste as Notes from ChatGPT
        </button>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
