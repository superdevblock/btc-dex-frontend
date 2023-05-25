import "./App.css";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import CreateLq from "./components/CreateLq";
import AddLq from "./components/AddLq";
import RemoveLq from "./components/RemoveLq";
import Swap from "./components/Swap";
import Airdrop from "./components/Airdrop";
import Tokens from "./components/Tokens";
import Docs from "./components/Docs";
import Info from "./components/Info";
import { useConnect, useAccount } from "wagmi"
import { MetaMaskConnector } from "@wagmi/connectors/metaMask"

function App() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  return (
    <div className="App">
      <Header />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<CreateLq isConnected={isConnected} address={address} />} />
          <Route path="/AddLq"
            // element={<div></div>}
            element={<AddLq isConnected={isConnected} address={address} />}
          />
          <Route path="/RemoveLq" element={<RemoveLq isConnected={isConnected} address={address} />} />
          <Route path="/Swap" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/Airdrop" element={<Airdrop isConnected={isConnected} address={address} />} />
          {/* <Route path="/tokens" element={<Tokens />} /> */}
          <Route path="/docs" element={<Docs />} />
          <Route path="/info" element={<Info />} />
        </Routes>
      </div>
    </div>
  )
}

export default App;
