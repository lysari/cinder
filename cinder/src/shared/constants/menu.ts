export const MENU_ACTIONS = ["new-tab", "close-tab", "previous-tab", "next-tab", "command-palette"] as const;
export type MenuAction = (typeof MENU_ACTIONS)[number];
