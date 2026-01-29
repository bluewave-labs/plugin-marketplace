/**
 * Theme configuration for Custom Framework Import plugin
 * Uses VerifyWise design system colors
 */

export const theme = {
  colors: {
    primary: {
      main: "#13715B",
      light: "#1a8a70",
      dark: "#0d5544",
      contrastText: "#FFFFFF",
      bg: "#e6f4f0",
    },
    secondary: {
      main: "#4C7BF4",
      light: "#6b92f6",
      dark: "#3a5fc0",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      bg: "#ecfdf5",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      bg: "#fffbeb",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      bg: "#fef2f2",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      bg: "#eff6ff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
      disabled: "#94a3b8",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
      hover: "#f1f5f9",
    },
    border: {
      light: "#e2e8f0",
      main: "#cbd5e1",
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  status: {
    "Not started": { color: "#94a3b8", bg: "#f1f5f9" },
    Draft: { color: "#f59e0b", bg: "#fffbeb" },
    "In progress": { color: "#3b82f6", bg: "#eff6ff" },
    "Awaiting review": { color: "#8b5cf6", bg: "#f5f3ff" },
    "Awaiting approval": { color: "#ec4899", bg: "#fdf2f8" },
    Implemented: { color: "#10b981", bg: "#ecfdf5" },
    Audited: { color: "#06b6d4", bg: "#ecfeff" },
    "Needs rework": { color: "#ef4444", bg: "#fef2f2" },
  },
};

export const statusOptions = [
  "Not started",
  "Draft",
  "In progress",
  "Awaiting review",
  "Awaiting approval",
  "Implemented",
  "Audited",
  "Needs rework",
];

export type StatusType = keyof typeof theme.status;
