
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";
import ThemeProvider from "./providers/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
   <ThemeProvider>
    <App />
    <Toaster position="top-right" />
    </ThemeProvider>
  </BrowserRouter>
  
);
