import React, { useState } from "react";

// Dynamically load all files inside ../routes except index.js
const routeContext = require.context(
  "../routes",
  false,
  /^(?!\.\/index).*\.js$/,
);

const routes = routeContext.keys().reduce((acc, file) => {
  const name = file.replace("./", "").replace(".js", "");
  const mod = routeContext(file);
  const Component = mod.default
    ? mod.default
    : () => <div>Component Not Ready</div>;
  acc[name] = Component;
  return acc;
}, {});

const tabs = Object.keys(routes);

const Home = () => <div>Welcome to DeckChatbot!</div>;

const App = () => {
  const [selectedTab, setSelectedTab] = useState("");

  const SelectedComponent = selectedTab ? routes[selectedTab] : Home;

  return (
    <div style={{ padding: 20 }}>
      <h1>DeckChatbot</h1>
      <nav
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid #ccc",
          marginBottom: 20,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              background: "none",
              border: "none",
              padding: "6px 12px",
              borderBottom:
                selectedTab === tab
                  ? "2px solid #000"
                  : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: 20 }}>
        <SelectedComponent />
      </div>
    </div>
  );
};

export default App;
