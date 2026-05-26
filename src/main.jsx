import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store.js";
import { Provider as ChakraUIProvider } from "./components/ui/provider.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <ChakraUIProvider>
        <App />
        <Toaster />
      </ChakraUIProvider>
    </ReduxProvider>
  </StrictMode>,
);
