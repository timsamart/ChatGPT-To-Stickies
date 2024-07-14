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
    message?: string;
    options?: any;
  }
  
  export interface FlatStickyData {
    title: string;
    content: string;
    level: number;
  }
  
  export interface ExportData {
    title: string;
    content: string;
  }