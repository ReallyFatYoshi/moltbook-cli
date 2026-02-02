import blessed from "blessed";

// UI Constants
export const UI_COLORS = {
  CYAN: "cyan",
  GREEN: "green",
  YELLOW: "yellow",
  MAGENTA: "magenta",
  BLACK: "black",
  WHITE: "white",
  GRAY: "gray",
  RED: "red",
} as const;

export const UI_STYLES = {
  header: {
    bg: "black",
    fg: UI_COLORS.CYAN,
  },
  selectedCyan: {
    selected: { bg: UI_COLORS.CYAN, fg: UI_COLORS.BLACK },
    border: { fg: UI_COLORS.CYAN },
  },
  selectedGreen: {
    selected: { bg: UI_COLORS.GREEN, fg: UI_COLORS.BLACK },
    item: { fg: UI_COLORS.WHITE },
    border: { fg: UI_COLORS.GREEN },
  },
  borderGreen: {
    border: { fg: UI_COLORS.GREEN },
  },
  borderYellow: {
    border: { fg: UI_COLORS.YELLOW },
  },
  borderMagenta: {
    border: { fg: UI_COLORS.MAGENTA },
  },
  focusYellow: {
    focus: { bg: UI_COLORS.YELLOW, fg: UI_COLORS.BLACK },
  },
  bgGreen: {
    bg: UI_COLORS.GREEN,
    fg: UI_COLORS.BLACK,
  },
  bgYellow: {
    bg: UI_COLORS.YELLOW,
    fg: UI_COLORS.BLACK,
  },
} as const;

// Common UI Element Creator Functions
export function createHeader(
  parent: blessed.Widgets.Screen,
  content: string,
  blessedLib = blessed,
) {
  return blessedLib.box({
    parent,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    content,
    style: UI_STYLES.header,
  });
}

export function createList(
  parent: blessed.Widgets.Node,
  options: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
    width?: string | number;
    height?: string | number;
    label?: string;
    style?: "cyan" | "green" | "magenta";
    blessedLib?: typeof blessed;
  },
) {
  const { style = "cyan", blessedLib = blessed, ...rest } = options;
  const styleMap = {
    cyan: UI_STYLES.selectedCyan,
    green: UI_STYLES.selectedGreen,
    magenta: UI_STYLES.borderMagenta,
  };

  return blessedLib.list({
    parent,
    keys: true,
    mouse: true,
    border: "line",
    ...rest,
    style: styleMap[style],
  });
}

export function createTextbox(
  parent: blessed.Widgets.Node,
  options: {
    top?: string | number;
    left?: string | number;
    right?: number;
    bottom?: string | number;
    height?: string | number;
    focusColor?: "yellow" | "green";
    blessedLib?: typeof blessed;
  },
) {
  const { focusColor = "yellow", blessedLib = blessed, ...rest } = options;
  const focusColorMap = {
    yellow: UI_STYLES.focusYellow,
    green: { focus: { bg: "green", fg: "black" } },
  };

  return blessedLib.textbox({
    parent,
    inputOnFocus: true,
    border: "line",
    ...rest,
    style: focusColorMap[focusColor],
  });
}

export function createBox(
  parent: blessed.Widgets.Node,
  options: {
    top?: string | number;
    left?: string | number;
    right?: number;
    bottom?: string | number;
    width?: string | number;
    height?: string | number;
    label?: string;
    content?: string;
    borderColor?: keyof typeof UI_STYLES;
    blessedLib?: typeof blessed;
  },
) {
  const { borderColor, blessedLib = blessed, ...rest } = options;
  const borderStyle = borderColor
    ? UI_STYLES[borderColor as keyof typeof UI_STYLES]
    : {};

  return blessedLib.box({
    parent,
    border: "line",
    ...rest,
    style: borderStyle,
  });
}

// Error message handler
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

// Keyboard shortcut handler - prevents duplication
export function setupGlobalKeyHandler(
  screen: blessed.Widgets.Screen,
  keys: string[],
  handler: () => void | Promise<void>,
) {
  screen.key(keys, handler);
}
