const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy API
app.use(
  "/analyze-image",
  createProxyMiddleware({
    target: "https://deckchatbot-backend.onrender.com",
    changeOrigin: true,
  }),
);

// Serve frontend
app.use(express.static(path.join(__dirname, "client")));
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.listen(PORT, () => {
  console.log();
});
