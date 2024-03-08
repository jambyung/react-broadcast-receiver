import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactBroadcastContextProvider } from "../lib/main.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactBroadcastContextProvider>
      <App />
    </ReactBroadcastContextProvider>
  </React.StrictMode>,
);
