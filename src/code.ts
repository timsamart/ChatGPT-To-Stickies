import { parseInput, StickyData } from "./utils";

figma.showUI(__html__, { themeColors: true, height: 600, width: 300 });

let nodes: StickyNode[] = [];
let undoStack: StickyNode[][] = [];

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
      const createdStickies = await createStickies(data, msg.maxCol, msg.color);
      figma.notify(`Created ${createdStickies} stickies`);

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
    const exportData = nodes.map(node => ({
      title: node.name,
      content: node.text.characters.split('\n\n')[1] || ""
    }));
    figma.ui.postMessage({ type: "export-data", data: exportData });
  }
};

async function createStickies(data: StickyData[], maxCol: number, color?: string): Promise<number> {
  let row = 0;
  let col = 0;
  let maxHeightInRow = 0;
  const padding = 50;

  for (const entry of data) {
    const stickyNode = figma.createSticky();
    stickyNode.text.characters = `${entry.title}\n\n${entry.content}`;

    const titleEndIndex = entry.title.length;
    const contentStartIndex = titleEndIndex + 2;

    stickyNode.text.setRangeFontName(0, titleEndIndex, { family: "Inter", style: "Medium" });
    stickyNode.text.setRangeFontSize(0, titleEndIndex, 24);

    stickyNode.text.setRangeFontName(contentStartIndex, stickyNode.text.characters.length, { family: "Inter", style: "Regular" });
    stickyNode.text.setRangeFontSize(contentStartIndex, stickyNode.text.characters.length, 16);

    if (color) {
      stickyNode.fills = [{ type: 'SOLID', color: hexToRgb(color) }];
    }

    const stickyHeight = stickyNode.height;

    if (stickyHeight > maxHeightInRow) {
      maxHeightInRow = stickyHeight;
    }

    stickyNode.x = col * (stickyNode.width + padding);
    stickyNode.y = row * (maxHeightInRow + padding);

    figma.currentPage.appendChild(stickyNode);
    nodes.push(stickyNode);

    col++;
    if (col >= maxCol) {
      row++;
      col = 0;
      maxHeightInRow = 0;
    }
  }

  return data.length;
}

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}