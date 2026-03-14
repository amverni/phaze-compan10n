import "@fontsource-variable/quicksand/index.css";
import "./index.css";

import { createHashHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryProvider } from "./components/QueryProvider/QueryProvider";
import { indexRoute } from "./routes/index";
import { rootRoute } from "./routes/root";

const routeTree = rootRoute.addChildren([indexRoute]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
