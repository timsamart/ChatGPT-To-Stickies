import { parseInput, SectionData, StickyData } from "./utils";

figma.showUI(__html__, { themeColors: true, height: 600, width: 300 });

let nodes: SectionNode[] = [];
let undoStack: SectionNode[][] = [];

figma.ui.onmessage = async (msg: { type: string; input?: string; maxCol?: number; format?: string; }) => {
  if (msg.type === "create-stickies") {
    figma.showUI(__html__, { visible: true });
  }

  if (msg.type === "process-input") {
    if (!msg.input || !msg.maxCol || !msg.format) {
      figma.notify("Invalid input. Please check your data and try again.");
      figma.ui.postMessage({ type: "creation-complete" });
      return;
    }

    try {
      const data = parseInput(msg.input, msg.format);
      if (data.length === 0) {
        figma.notify("No valid data found. Please check your input and try again.");
        figma.ui.postMessage({ type: "creation-complete" });
        return;
      }

      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });

      undoStack.push([...nodes]);
      nodes = [];
      const createdSections = await createSectionsWithStickies(data, msg.maxCol);
      figma.notify(`Created ${createdSections} sections with stickies`);

      figma.viewport.scrollAndZoomIntoView(nodes);
      
      figma.ui.postMessage({ type: "creation-complete" });
    } catch (error) {
      figma.notify(`Error: ${error.message}`);
      figma.ui.postMessage({ type: "creation-complete" });
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

async function createSectionsWithStickies(data: SectionData[], maxCol: number): Promise<number> {
  const sectionPadding = 100;
  const maxWidth = figma.viewport.bounds.width;
  let sectionX = 0;
  let sectionY = 0;
  let rowMaxHeight = 0;

  for (const [index, sectionData] of data.entries()) {
    const section = figma.createSection();
    section.name = sectionData.title;

    const titleText = figma.createText();
    titleText.characters = sectionData.title;
    titleText.fontSize = 24;
    titleText.fontName = { family: "Inter", style: "Medium" };
    section.appendChild(titleText);

    const sectionColor = generatePastelColor(index);
    const { width, height } = await createStickies(sectionData.stickies, maxCol, sectionColor, section);

    // Resize section to fit content
    const sectionPadding = 40;
    section.resizeWithoutConstraints(
      width + sectionPadding * 2,
      height + titleText.height + sectionPadding * 3
    );

    // Reposition content within section
    section.children.forEach(child => {
      child.x += sectionPadding;
      child.y += titleText.height + sectionPadding * 2;
    });
    titleText.x = sectionPadding;
    titleText.y = sectionPadding;

    // Position the section
    if (sectionX + section.width > maxWidth) {
      sectionX = 0;
      sectionY += rowMaxHeight + sectionPadding;
      rowMaxHeight = 0;
    }

    section.x = sectionX;
    section.y = sectionY;

    sectionX += section.width + sectionPadding;
    rowMaxHeight = Math.max(rowMaxHeight, section.height);

    figma.currentPage.appendChild(section);
    nodes.push(section);
  }

  return data.length;
}

async function createStickies(data: StickyData[], maxCol: number, sectionColor: RGB, parentSection: SectionNode): Promise<{ width: number, height: number }> {
  const stickyPadding = 20;
  let stickyX = 0;
  let stickyY = 0;
  let maxRowHeight = 0;
  let maxWidth = 0;
  let totalHeight = 0;

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

    stickyNode.fills = [{ type: 'SOLID', color: sectionColor }];

    stickyNode.isWideWidth = true;

    parentSection.appendChild(stickyNode);

    // Position the sticky
    stickyNode.x = stickyX;
    stickyNode.y = stickyY;

    // Update maxRowHeight and maxWidth
    maxRowHeight = Math.max(maxRowHeight, stickyNode.height);
    maxWidth = Math.max(maxWidth, stickyX + stickyNode.width);

    // Move to the next column or row
    if ((i + 1) % maxCol === 0) {
      stickyX = 0;
      stickyY += maxRowHeight + stickyPadding;
      totalHeight += maxRowHeight + stickyPadding;
      maxRowHeight = 0;
    } else {
      stickyX += stickyNode.width + stickyPadding;
    }
  }

  // Add the height of the last row
  totalHeight += maxRowHeight;

  return { width: maxWidth, height: totalHeight };
}

function generatePastelColor(index: number): RGB {
  const hue = (index * 137.508) % 360; // Use golden angle approximation for even distribution
  const saturation = 0.5; // 50% saturation for pastel colors
  const lightness = 0.8; // 80% lightness for pastel colors

  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = lightness - c / 2;

  let r, g, b;
  if (hue < 60) {
    [r, g, b] = [c, x, 0];
  } else if (hue < 120) {
    [r, g, b] = [x, c, 0];
  } else if (hue < 180) {
    [r, g, b] = [0, c, x];
  } else if (hue < 240) {
    [r, g, b] = [0, x, c];
  } else if (hue < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: r + m,
    g: g + m,
    b: b + m
  };
}