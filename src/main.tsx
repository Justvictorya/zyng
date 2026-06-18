import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ZyngProvider } from "./context/ZyngContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ZyngProvider>
        <App />
      </ZyngProvider>
    </BrowserRouter>
  </StrictMode>
);
