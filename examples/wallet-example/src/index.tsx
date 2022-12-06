import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import theme from "./theme";
import {CssBaseline, ThemeProvider} from "@mui/material";


// Create a root.
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme/>
        <App />
    </ThemeProvider>
);
