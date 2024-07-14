// Define interfaces
export interface StickyData {
  title: string;
  content: string;
}

export interface SectionData {
  title: string;
  stickies: (StickyData | SectionData)[];
}

// Parse input based on format
export function parseInput(input: string, format: string): SectionData[] {
  switch (format) {
    case "plain":
      return [{ title: "Main Section", stickies: parseNotes(input) }];
    case "json":
    case "unstructured-json":
      return parseJSON(input);
    default:
      console.error("Unsupported input format");
      return [];
  }
}

// Parse plain text notes
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

// Parse JSON input
export function parseJSON(input: string): SectionData[] {
  try {
    const parsed = JSON.parse(input);
    
    // Check if it's already in the expected format
    if (isStructuredJSON(parsed)) {
      return parsed;
    }
    
    // If not, treat it as unstructured JSON
    return parseUnstructuredJSON(parsed);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

// Check if JSON is in structured format
function isStructuredJSON(data: any): data is SectionData[] {
  return Array.isArray(data) &&
    data.every(section =>
      typeof section === 'object' &&
      'title' in section &&
      Array.isArray(section.stickies) &&
      section.stickies.every(sticky =>
        typeof sticky === 'object' &&
        'title' in sticky &&
        'content' in sticky
      )
    );
}

// Parse unstructured JSON
function parseUnstructuredJSON(input: any): SectionData[] {
  const sections: SectionData[] = [];

  function processObject(obj: any, parentTitle: string = ""): void {
    Object.entries(obj).forEach(([key, value]) => {
      const currentTitle = parentTitle ? `${parentTitle} - ${key}` : key;
      
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // If it's an object, create a new section
        const section: SectionData = { title: currentTitle, stickies: [] };
        sections.push(section);
        
        // Process the nested object
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === "object" && subValue !== null && !Array.isArray(subValue)) {
            // If it's another nested object, recurse
            processObject(subValue, `${currentTitle} - ${subKey}`);
          } else {
            // If it's a primitive or array, create a sticky
            section.stickies.push({
              title: subKey,
              content: Array.isArray(subValue) ? subValue.join(", ") : String(subValue)
            });
          }
        });
      } else if (Array.isArray(value)) {
        // If it's an array, create a section with stickies for each item
        const section: SectionData = { title: currentTitle, stickies: [] };
        sections.push(section);
        
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            section.stickies.push({
              title: `Item ${index + 1}`,
              content: JSON.stringify(item, null, 2)
            });
          } else {
            section.stickies.push({
              title: `Item ${index + 1}`,
              content: String(item)
            });
          }
        });
      } else {
        // For primitive values, add to the parent section or create a new one
        let section = sections.find(s => s.title === parentTitle);
        if (!section) {
          section = { title: parentTitle || "Miscellaneous", stickies: [] };
          sections.push(section);
        }
        section.stickies.push({
          title: key,
          content: String(value)
        });
      }
    });
  }

  processObject(input);
  return sections;
}

// Parse sticky data
function parseStickyData(data: any): StickyData[] {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (!item.title && !item.content) {
        throw new Error(`Item at index ${index} is missing both title and content`);
      }
      return {
        title: String(item.title || ''),
        content: String(item.content || '')
      };
    });
  } else if (typeof data === 'object') {
    return Object.entries(data).map(([title, content]) => ({
      title,
      content: String(content)
    }));
  } else {
    throw new Error('Invalid data format for sticky notes');
  }
}