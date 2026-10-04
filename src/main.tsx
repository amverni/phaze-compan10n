import "@fontsource-variable/quicksand/index.css";
import "./index.css";

import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { LogoThemeProvider } from "./components/Logo/LogoThemeProvider";
import { QueryProvider } from "./components/QueryProvider/QueryProvider";
import { router } from "./routes/-router";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryProvider>
        <LogoThemeProvider>
          <RouterProvider router={router} />
        </LogoThemeProvider>
      </QueryProvider>
    </React.StrictMode>,
  );
}
