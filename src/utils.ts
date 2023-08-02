// utils.ts

export function parseNotes(
  notes: string
): { title: string; content: string }[] {
  const noteLines = notes.replace(/\*\*/g, "").split("\n");

  let title = "";
  let content = "";

  const entries: { title: string; content: string }[] = [];

  noteLines.forEach((line, index) => {
    line = line.trim();

    if (line === "") {
      // If the line is empty, we've found a new paragraph/note
      if (title !== "" || content.trim() !== "") {
        // ignore empty content
        entries.push({ title, content: content.trim() });
      }
      title = "";
      content = "";
    } else if (line.includes(":")) {
      if (line.endsWith(":")) {
        // if line ends with ':' treat it as content
        content += ` ${line.trim().slice(0, -1)}`; // remove ':' from the end
      } else {
        if (title !== "" || content.trim() !== "") {
          // new note found, push the previous one
          entries.push({ title, content: content.trim() });
          content = "";
        }
        const lineParts = line.split(":");
        title = lineParts[0].trim();
        content += lineParts.slice(1).join(":").trim(); // handles multiple ":" in the line
      }
    } else {
      content += ` ${line.trim()}`;
    }

    // if it is the last line, push the content
    if (
      index === noteLines.length - 1 &&
      (title !== "" || content.trim() !== "")
    ) {
      entries.push({ title, content: content.trim() });
    }
  });

  return entries;
}
