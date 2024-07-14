export enum UIMessageType {
    CREATE_STICKIES = "create-stickies",
    PROCESS_INPUT = "process-input",
    UNDO = "undo",
    EXPORT = "export",
    SHOW_NOTIFICATION = "show-notification",
    CREATION_COMPLETE = "creation-complete",
    EXPORT_DATA = "export-data",
    SHOW_PROMPT = "show-prompt"
  }
  
  export interface UIMessage {
    type: UIMessageType;
    input?: string;
    format?: string;
    maxCol?: number;
    createSection?: boolean;
    message?: string;
    options?: any;
  }
  
  export interface FlatStickyData {
    title: string;
    content: string;
    level: number;
  }
  
  export interface StickyData {
    title: string;
    content: string;
  }
  
  export interface SectionData {
    title: string;
    stickies: StickyData[];
  }
  
  export interface ExportData {
    title: string;
    content?: string;
    stickies?: ExportData[];
  }