import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import { App } from "./App";
import "./styles.css";

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    primary: { main: "#c82770", dark: "#9e1555" },
    secondary: { main: "#216e62" },
    background: { default: "#f6f7f8", paper: "#ffffff" },
    text: { primary: "#29252c", secondary: "#706b75" },
    error: { main: "#b83b43" },
    success: { main: "#217463" },
    divider: "#e9e6eb",
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#eeebef" } } },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
