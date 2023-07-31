// Parser function
export function parseNotes(
  notes: string
): { title: string; content: string }[] {
  const lines = notes.split("\n");
  let entries = [];

  lines.forEach((line) => {
    line = line.trim().replace(/\*\*/g, ""); // Trim spaces and remove **

    if (!line) {
      // Skip empty lines
      return;
    }

    if (line.includes(":")) {
      // Title: Content structure
      const parts = line.split(":");
      const entry = {
        title: parts[0].trim(),
        content: parts.slice(1).join(":").trim(),
      };
      entries.push(entry);
    }
  });

  return entries;
}
