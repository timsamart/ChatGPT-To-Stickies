import { StickyManager } from './stickyManager';
import { UIMessage, UIMessageType } from './types';
import { CONFIG } from './config';

export class UIMessageHandler {
  private stickyManager: StickyManager;
  private lastCopiedPrompt: string = "";

  constructor(stickyManager: StickyManager) {
    this.stickyManager = stickyManager;
  }

  async handleMessage(msg: UIMessage) {
    switch (msg.type) {
      case UIMessageType.CREATE_STICKIES:
        figma.showUI(__html__, { visible: true });
        break;

      case UIMessageType.PROCESS_INPUT:
        await this.handleProcessInput(msg);
        break;

      case UIMessageType.UNDO:
        this.stickyManager.undo();
        break;

      case UIMessageType.EXPORT:
        this.handleExport();
        break;

      case UIMessageType.SHOW_NOTIFICATION:
        this.handleNotification(msg);
        break;

      default:
        console.warn(`Unhandled message type: ${msg.type}`);
    }
  }

  private async handleProcessInput(msg: UIMessage) {
    if (!msg.input || !msg.format) {
      figma.notify("Invalid input. Please check your data and try again.", { error: true });
      figma.ui.postMessage({ type: UIMessageType.CREATION_COMPLETE });
      return;
    }

    try {
      await figma.loadFontAsync(CONFIG.fonts.bold);
      await figma.loadFontAsync(CONFIG.fonts.medium);
      await figma.loadFontAsync(CONFIG.fonts.regular);

      const createdItems = await this.stickyManager.createStickiesFromInput(
        msg.input,
        msg.format,
        msg.maxCol || CONFIG.defaultMaxColumns,
        msg.createSection || false
      );

      figma.notify(`Created ${createdItems} stickies`, {
        timeout: CONFIG.notificationTimeout,
        button: {
          text: "Undo",
          action: () => {
            this.stickyManager.undo();
            return true;
          }
        }
      });

      figma.viewport.scrollAndZoomIntoView(this.stickyManager.getNodes());
      figma.ui.postMessage({ type: UIMessageType.CREATION_COMPLETE });
    } catch (error) {
      figma.notify(`Error: ${error.message}`, { error: true });
      figma.ui.postMessage({ type: UIMessageType.CREATION_COMPLETE });
    }
  }

  private handleExport() {
    const exportData = this.stickyManager.getExportData();
    figma.ui.postMessage({ type: UIMessageType.EXPORT_DATA, data: exportData });
  }

  private handleNotification(msg: UIMessage) {
    const notificationHandler = figma.notify(msg.message, {
      ...msg.options,
      onDequeue: (reason) => {
        if (reason === 'action_button_click' && msg.options?.button?.action === 'view-prompt') {
          figma.showUI(__html__, { visible: true });
          figma.ui.postMessage({ type: UIMessageType.SHOW_PROMPT, prompt: this.lastCopiedPrompt });
        }
      }
    });
    
    if (msg.message.includes("copied to clipboard")) {
      this.lastCopiedPrompt = msg.message;
    }
  }
}