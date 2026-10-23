export const DOCUMENT_VIEWS = ["table", "tree", "json"] as const;
export type DocumentView = (typeof DOCUMENT_VIEWS)[number];
