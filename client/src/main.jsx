import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./CommerceApp";
import "./styles.css";
import "./saas.css";
import "./storefront.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>
);
