import { createTheme } from "@mui/material/styles"

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffffff",
    },
    secondary: {
      main: "#e0e0e0",
    },
    background: {
      default: "#232526",
      paper: "#2a2a2a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Orbitron", monospace',
    },
    h2: {
      fontFamily: '"Orbitron", monospace',
    },
    h3: {
      fontFamily: '"Orbitron", monospace',
    },
    h4: {
      fontFamily: '"Orbitron", monospace',
    },
  },
})
