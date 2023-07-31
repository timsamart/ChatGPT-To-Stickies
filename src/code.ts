import { parseNotes } from "./utils";

figma.showUI(__html__, { themeColors: true, height: 300 });

let nodes = []; // Declare nodes at higher scope

figma.ui.onmessage = async (msg) => {
  if (msg.type === "paste-notes") {
    figma.showUI(__html__, { visible: true });
  }

  if (msg.type === "notes") {
    let notes = msg.notes;
    let maxCol = msg.maxCol; // This should be sent from your UI

    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    const entries = parseNotes(notes);

    let row = 0;
    let col = 0;
    const padding = 50; // Padding between stickies

    entries.forEach(async (entry) => {
      const title = entry.title;
      const content = entry.content;

      const stickyNode = figma.createSticky();
      stickyNode.text.characters = `${title}\n\n${content}`;

      const titleEndIndex = title.length;
      const contentStartIndex = titleEndIndex + 2; // Account for the two newline characters

      // Set title font style
      stickyNode.text.setRangeFontName(0, titleEndIndex, {
        family: "Inter",
        style: "Medium",
      });
      stickyNode.text.setRangeFontSize(0, titleEndIndex, 24);

      // Set content font style
      stickyNode.text.setRangeFontName(
        contentStartIndex,
        stickyNode.text.characters.length,
        { family: "Inter", style: "Regular" } // Assuming "Small" is not a valid style for "Inter" family
      );
      stickyNode.text.setRangeFontSize(
        contentStartIndex,
        stickyNode.text.characters.length,
        16
      );

      // Set position based on grid
      stickyNode.x = col * (stickyNode.width + padding);
      stickyNode.y = row * (stickyNode.height + padding);

      figma.currentPage.appendChild(stickyNode);
      nodes.push(stickyNode);

      // Update the grid position for the next sticky
      col++;
      if (col >= maxCol) {
        row++;
        col = 0;
      }
    });
  }
};
