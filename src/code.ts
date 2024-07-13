import { parseInput, SectionData, StickyData } from "./utils";

figma.showUI(__html__, { themeColors: true, height: 600, width: 300 });

let nodes: SectionNode[] = [];
let undoStack: SectionNode[][] = [];

figma.ui.onmessage = async (msg: { type: string; input?: string; maxCol?: number; format?: string; color?: string }) => {
  if (msg.type === "create-stickies") {
    figma.showUI(__html__, { visible: true });
  }

  if (msg.type === "process-input") {
    if (!msg.input || !msg.maxCol || !msg.format) {
      figma.notify("Invalid input. Please check your data and try again.");
      return;
    }

    try {
      const data = parseInput(msg.input, msg.format);
      if (data.length === 0) {
        figma.notify("No valid data found. Please check your input and try again.");
        return;
      }

      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });

      undoStack.push([...nodes]);
      nodes = [];
      const createdSections = await createSectionsWithStickies(data, msg.maxCol, msg.color);
      figma.notify(`Created ${createdSections} sections with stickies`);

      figma.viewport.scrollAndZoomIntoView(nodes);
    } catch (error) {
      figma.notify(`Error: ${error.message}`);
    }
  }

  if (msg.type === "undo") {
    if (undoStack.length > 0) {
      const previousNodes = undoStack.pop();
      nodes.forEach(node => node.remove());
      nodes = previousNodes;
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
      figma.notify("Undo successful");
    } else {
      figma.notify("Nothing to undo");
    }
  }

  if (msg.type === "export") {
    const exportData = nodes.map(sectionNode => ({
      title: sectionNode.name,
      stickies: sectionNode.findAll(node => node.type === "STICKY").map((stickyNode: StickyNode) => ({
        title: stickyNode.name,
        content: stickyNode.text.characters.split('\n\n')[1] || ""
      }))
    }));
    figma.ui.postMessage({ type: "export-data", data: exportData });
  }
};

async function createSectionsWithStickies(data: SectionData[], maxCol: number, color?: string): Promise<number> {
  let sectionX = 0;
  let sectionY = 0;
  const sectionPadding = 100;
  const maxWidth = figma.viewport.bounds.width;

  for (const sectionData of data) {
    const section = figma.createSection();
    section.name = sectionData.title;

    const titleText = figma.createText();
    titleText.characters = sectionData.title;
    titleText.fontSize = 24;
    titleText.fontName = { family: "Inter", style: "Medium" };
    section.appendChild(titleText);

    await createStickies(sectionData.stickies, maxCol, color, section);

    // Adjust section position
    if (sectionX + section.width > maxWidth) {
      sectionX = 0;
      sectionY += section.height + sectionPadding;
    }
    section.x = sectionX;
    section.y = sectionY;
    sectionX += section.width + sectionPadding;

    figma.currentPage.appendChild(section);
    nodes.push(section);
  }

  return data.length;
}

async function createStickies(data: StickyData[], maxCol: number, color: string, parentSection: SectionNode): Promise<void> {
  const stickyPadding = 20;
  let stickyX = 0;
  let stickyY = 40; // Leave space for the section title
  let maxRowHeight = 0;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const stickyNode = figma.createSticky();
    stickyNode.text.characters = entry.title;

    if (entry.content) {
      stickyNode.text.insertCharacters(stickyNode.text.characters.length, "\n\n" + entry.content);
    }

    const titleEndIndex = entry.title.length;
    const contentStartIndex = titleEndIndex + (entry.content ? 2 : 0);

    if (titleEndIndex > 0) {
      stickyNode.text.setRangeFontName(0, titleEndIndex, { family: "Inter", style: "Medium" });
      stickyNode.text.setRangeFontSize(0, titleEndIndex, 16);
    }

    if (entry.content) {
      stickyNode.text.setRangeFontName(contentStartIndex, stickyNode.text.characters.length, { family: "Inter", style: "Regular" });
      stickyNode.text.setRangeFontSize(contentStartIndex, stickyNode.text.characters.length, 12);
    }

    if (color) {
      stickyNode.fills = [{ type: 'SOLID', color: hexToRgb(color) }];
    }

    stickyNode.isWideWidth = true;

    parentSection.appendChild(stickyNode);

    // Position the sticky
    stickyNode.x = stickyX;
    stickyNode.y = stickyY;

    // Update maxRowHeight
    maxRowHeight = Math.max(maxRowHeight, stickyNode.height);

    // Move to the next column or row
    if ((i + 1) % maxCol === 0) {
      stickyX = 0;
      stickyY += maxRowHeight + stickyPadding;
      maxRowHeight = 0;
    } else {
      stickyX += stickyNode.width + stickyPadding;
    }
  }
}

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}