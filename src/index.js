import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { configureChains, mainnet, WagmiConfig, createClient } from "wagmi";
import { publicProvider } from "wagmi/providers/public"
import { AppContextProvider } from './context';
import { ConfigProvider, theme } from 'antd'

const { provider, webSocketProvider } = configureChains(
  [mainnet],
  [publicProvider()]
)

const client = createClient({
  provider,
  webSocketProvider,
  autoConnect: true,
})

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <WagmiConfig client={client}>
    <BrowserRouter>
      <AppContextProvider>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
          }}
        >
          <App />
        </ConfigProvider>
      </AppContextProvider>
    </BrowserRouter>
  </WagmiConfig>
  // </React.StrictMode>
);
