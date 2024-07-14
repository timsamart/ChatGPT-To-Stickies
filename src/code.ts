import { UIMessageHandler } from './uiMessageHandler';
import { StickyManager } from './stickyManager';
import { CONFIG } from './config';

figma.showUI(__html__, CONFIG.uiOptions);

const stickyManager = new StickyManager();
const uiMessageHandler = new UIMessageHandler(stickyManager);

figma.ui.onmessage = (msg) => {
  uiMessageHandler.handleMessage(msg);
};