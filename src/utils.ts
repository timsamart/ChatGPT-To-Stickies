export interface StickyData {
  title: string;
  content: string;
}

export function parseInput(input: string, format: string): StickyData[] {
  switch (format) {
    case "plain":
      return parseNotes(input);
    case "json":
      return parseJSON(input);
    default:
      console.error("Unsupported input format");
      return [];
  }
}

export function parseNotes(notes: string): StickyData[] {
  const noteLines = notes.replace(/\*\*/g, "").split("\n");
  const entries: StickyData[] = [];
  let currentEntry: StickyData = { title: "", content: "" };

  noteLines.forEach((line, index) => {
    line = line.trim();

    if (line === "") {
      if (currentEntry.title || currentEntry.content.trim()) {
        entries.push({ ...currentEntry });
        currentEntry = { title: "", content: "" };
      }
    } else if (line.includes(":")) {
      const [title, ...contentParts] = line.split(":");
      if (contentParts.length > 0) {
        if (currentEntry.title || currentEntry.content.trim()) {
          entries.push({ ...currentEntry });
        }
        currentEntry.title = title.trim();
        currentEntry.content = contentParts.join(":").trim();
      } else {
        currentEntry.content += ` ${line.trim()}`;
      }
    } else {
      currentEntry.content += ` ${line.trim()}`;
    }

    if (index === noteLines.length - 1 && (currentEntry.title || currentEntry.content.trim())) {
      entries.push({ ...currentEntry });
    }
  });

  return entries;
}

export function parseJSON(input: string): StickyData[] {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        if (!item.title && !item.content) {
          throw new Error(`Item at index ${index} is missing both title and content`);
        }
        return {
          title: String(item.title || ''),
          content: String(item.content || '')
        };
      });
    } else {
      throw new Error('Invalid JSON format: expected an array of objects');
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}