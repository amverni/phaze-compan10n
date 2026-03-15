import "@fontsource-variable/quicksand/index.css";
import "./index.css";

import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryProvider } from "./components/QueryProvider/QueryProvider";
import { router } from "./routes/router";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </React.StrictMode>,
  );
}
