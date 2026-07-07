import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { App } from "./App";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        autoClose={3500}
        closeOnClick
        draggable
        newestOnTop
        pauseOnHover
        position="top-right"
        theme="light"
      />
    </BrowserRouter>
  </React.StrictMode>
);
