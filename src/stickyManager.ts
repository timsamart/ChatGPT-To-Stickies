import { FlatStickyData, ExportData } from './types';
import { CONFIG } from './config';

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

  async createStickiesFromJSON(data: any, maxCol: number): Promise<number> {
    const flatData = this.flattenJSON(data);
    this.undoStack.push([...this.nodes]);
    this.nodes = [];

    let stickyX = 0;
    let stickyY = 0;
    let maxRowHeight = 0;
    let createdItems = 0;

    for (let i = 0; i < flatData.length; i++) {
      const entry = flatData[i];
      const stickyNode = figma.createSticky();
      stickyNode.name = entry.title;
      stickyNode.text.characters = entry.title + (entry.content ? '\n\n' + entry.content : '');

      this.applyTextStyles(stickyNode, entry);

      stickyNode.fills = [{ type: 'SOLID', color: this.generatePastelColor(entry.level) }];
      stickyNode.x = stickyX + (entry.level * CONFIG.levelIndent);
      stickyNode.y = stickyY;

      figma.currentPage.appendChild(stickyNode);
      this.nodes.push(stickyNode);
      createdItems++;

      maxRowHeight = Math.max(maxRowHeight, stickyNode.height);

      if ((i + 1) % maxCol === 0) {
        stickyX = 0;
        stickyY += maxRowHeight + CONFIG.stickyPadding;
        maxRowHeight = 0;
      } else {
        stickyX += stickyNode.width + CONFIG.stickyPadding;
      }
    }

    return createdItems;
  }

  getExportData(): ExportData[] {
    return this.nodes
      .filter((node): node is StickyNode => node.type === "STICKY")
      .map(node => ({
        title: node.name,
        content: node.text.characters.split('\n\n')[1] || ""
      }));
  }

  private flattenJSON(data: any, level: number = 0, parentKey: string = ""): FlatStickyData[] {
    let result: FlatStickyData[] = [];

    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const newParentKey = parentKey ? `${parentKey} - Item ${index + 1}` : `Item ${index + 1}`;
          result = result.concat(this.flattenJSON(item, level + 1, newParentKey));
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          const newParentKey = parentKey ? `${parentKey} - ${key}` : key;
          if (typeof value === "object" && value !== null) {
            result.push({ title: newParentKey, content: "", level });
            result = result.concat(this.flattenJSON(value, level + 1, newParentKey));
          } else {
            result.push({ title: newParentKey, content: String(value), level });
          }
        });
      }
    } else {
      result.push({ title: parentKey, content: String(data), level });
    }

    return result;
  }

  private applyTextStyles(stickyNode: StickyNode, entry: FlatStickyData) {
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

  private generatePastelColor(level: number): RGB {
    const hue = (level * CONFIG.colorGeneration.goldenAngle) % 360;
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