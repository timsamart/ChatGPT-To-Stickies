import { FlatStickyData, ExportData, SectionData, StickyData } from './types';
import { CONFIG } from './config';
import { parseInput } from './utils';

export class StickyManager {
  private nodes: SceneNode[] = [];
  private undoStack: SceneNode[][] = [];

  getNodes(): SceneNode[] {
    return this.nodes;
  }

  undo() {
    if (this.undoStack.length > 0) {
      const previousNodes = this.undoStack.pop();
      this.nodes.forEach(node => node.remove());
      this.nodes = previousNodes || [];
      figma.currentPage.selection = this.nodes;
      figma.viewport.scrollAndZoomIntoView(this.nodes);
      figma.notify("Undo successful");
    } else {
      figma.notify("Nothing to undo", { error: true });
    }
  }

  async createStickiesFromInput(input: string, format: string, maxCol: number, createSection: boolean): Promise<number> {
    const data = parseInput(input, format);
    return this.createSectionsWithStickies(data, maxCol, createSection);
  }

  async createSectionsWithStickies(data: SectionData[], maxCol: number, createSection: boolean): Promise<number> {
    this.undoStack.push([...this.nodes]);
    this.nodes = [];

    const sectionPadding = CONFIG.sectionPadding;
    const maxWidth = figma.viewport.bounds.width;
    let sectionX = 0;
    let sectionY = 0;
    let rowMaxHeight = 0;
    let createdItems = 0;

    for (const [index, sectionData] of data.entries()) {
      const sectionColor = this.generatePastelColor(index);

      if (createSection) {
        const parentNode = this.createSectionNode(sectionData.title);
        const { width, height } = await this.createStickies(sectionData.stickies, maxCol, sectionColor, parentNode);

        this.positionNode(parentNode, sectionX, sectionY, width, height);
        sectionX += parentNode.width + sectionPadding;
        rowMaxHeight = Math.max(rowMaxHeight, parentNode.height);

        figma.currentPage.appendChild(parentNode);
        this.nodes.push(parentNode);

        if (sectionX > maxWidth) {
          sectionX = 0;
          sectionY += rowMaxHeight + sectionPadding;
          rowMaxHeight = 0;
        }

        createdItems++;
      } else {
        const { width, height, stickies } = await this.createStickies(sectionData.stickies, maxCol, sectionColor, null);
        stickies.forEach(sticky => {
          this.positionNode(sticky, sectionX, sectionY, sticky.width, sticky.height);
          figma.currentPage.appendChild(sticky);
          this.nodes.push(sticky);
        });

        sectionX += width + sectionPadding;
        rowMaxHeight = Math.max(rowMaxHeight, height);

        if (sectionX > maxWidth) {
          sectionX = 0;
          sectionY += rowMaxHeight + sectionPadding;
          rowMaxHeight = 0;
        }

        createdItems += stickies.length;
      }
    }

    return createdItems;
  }

  private createSectionNode(title: string): SectionNode {
    const section = figma.createSection();
    section.name = title;

    const titleText = figma.createText();
    titleText.characters = title;
    titleText.fontSize = CONFIG.fontSize.sectionTitle;
    titleText.fontName = CONFIG.fonts.medium;
    section.appendChild(titleText);

    return section;
  }

  private async createStickies(data: (StickyData | SectionData)[], maxCol: number, sectionColor: RGB, parentNode: SectionNode | null): Promise<{ width: number, height: number, stickies: StickyNode[] }> {
    const stickyPadding = CONFIG.stickyPadding;
    let stickyX = 0;
    let stickyY = 0;
    let maxRowHeight = 0;
    let maxWidth = 0;
    let totalHeight = 0;
    let stickies: StickyNode[] = [];

    for (const entry of data) {
      if ("content" in entry) {
        const stickyNode = figma.createSticky();
        stickyNode.name = entry.title;
        stickyNode.text.characters = entry.title + (entry.content ? '\n\n' + entry.content : '');

        this.applyTextStyles(stickyNode, entry);
        stickyNode.fills = [{ type: 'SOLID', color: sectionColor }];

        if (parentNode) {
          parentNode.appendChild(stickyNode);
        }
        stickies.push(stickyNode);

        stickyNode.x = stickyX;
        stickyNode.y = stickyY;

        maxRowHeight = Math.max(maxRowHeight, stickyNode.height);
        maxWidth = Math.max(maxWidth, stickyX + stickyNode.width);

        if ((stickies.length + 1) % maxCol === 0) {
          stickyX = 0;
          stickyY += maxRowHeight + stickyPadding;
          totalHeight += maxRowHeight + stickyPadding;
          maxRowHeight = 0;
        } else {
          stickyX += stickyNode.width + stickyPadding;
        }
      } else if ("stickies" in entry) {
        const nestedSectionColor = this.generatePastelColor(stickies.length);
        const { width, height, stickies: nestedStickies } = await this.createStickies(entry.stickies, maxCol, nestedSectionColor, parentNode);

        nestedStickies.forEach(sticky => {
          sticky.x += stickyX;
          sticky.y += stickyY;
          figma.currentPage.appendChild(sticky);
          this.nodes.push(sticky);
        });

        maxRowHeight = Math.max(maxRowHeight, height);
        maxWidth = Math.max(maxWidth, stickyX + width);
        stickyX += width + stickyPadding;
      }
    }

    totalHeight += maxRowHeight;

    return { width: maxWidth, height: totalHeight, stickies };
  }

  private positionNode(node: SceneNode, x: number, y: number, width: number, height: number) {
    node.x = x;
    node.y = y;

    if (node.type === 'SECTION') {
      node.resizeWithoutConstraints(width, height);
      node.children.forEach(child => {
        if (child.type !== "TEXT") {
          child.x += CONFIG.stickyPadding;
          child.y += CONFIG.fontSize.sectionTitle + CONFIG.sectionTitlePadding;
        }
      });
    }
  }

  getExportData(): ExportData[] {
    return this.nodes.map(node => {
      if (node.type === "SECTION") {
        return {
          title: node.name,
          stickies: node.findChildren(n => n.type === "STICKY").map((stickyNode: StickyNode) => ({
            title: stickyNode.name,
            content: stickyNode.text.characters.split('\n\n')[1] || ""
          }))
        };
      } else if (node.type === "STICKY") {
        return {
          title: node.name,
          content: node.text.characters.split('\n\n')[1] || ""
        };
      }
    }).filter(Boolean);
  }

  private applyTextStyles(stickyNode: StickyNode, entry: StickyData) {
    const titleEndIndex = entry.title.length;
    if (titleEndIndex > 0) {
      stickyNode.text.setRangeFontName(0, titleEndIndex, CONFIG.fonts.medium);
      stickyNode.text.setRangeFontSize(0, titleEndIndex, CONFIG.fontSize.title);
    }
    if (entry.content) {
      stickyNode.text.setRangeFontName(titleEndIndex + 2, stickyNode.text.characters.length, CONFIG.fonts.regular);
      stickyNode.text.setRangeFontSize(titleEndIndex + 2, stickyNode.text.characters.length, CONFIG.fontSize.content);
    }
  }

  private generatePastelColor(index: number): RGB {
    const hue = (index * CONFIG.colorGeneration.goldenAngle) % 360;
    const saturation = CONFIG.colorGeneration.saturation;
    const lightness = CONFIG.colorGeneration.lightness;

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
}
