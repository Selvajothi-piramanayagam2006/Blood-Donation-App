import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./App.css";

const root = createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>

    <Auth0Provider
      domain="dev-4m40cis5etmm00fg.us.auth0.com"
      clientId="AEqhkiLLIseiyh8jyNZPsNlCt46hk53I"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >

      <App />

    </Auth0Provider>

  </React.StrictMode>
);