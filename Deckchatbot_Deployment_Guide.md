# DeckChatbot Deployment Guide

This README provides a full step-by-step guide for deploying DeckChatbot using Azure services with GitHub integration.

---

## ✅ Overview

* **Frontend**: React or Vite app → Azure **Static Web App**
* **Backend**: Node.js Express API → Azure **App Service**
* **CI/CD**: GitHub → Azure Static Web App
* **Custom Domain**: Supported (see section below)

---

## 📁 Project Structure Assumption

```
deckchatbot-monorepo/
├── frontend/        # Express backend
├── client/          # React or Vite frontend
```

---

## ⚠️ Azure Authentication Requirement

Before running any Azure CLI command:

```bash
az login
```

> This will open a browser window to authenticate your Azure account.

If you're using Cloud Shell, you're already logged in. Otherwise, failing to run this will result in:

```
ERROR: Please run 'az login' to setup account.
```

---

## 🔧 Backend Deployment (Azure App Service)

```bash
cd ~/clouddrive/deckchatbot-monorepo/frontend

# Ensure correct start script in package.json:
# "start": "node server.js"

az webapp up \
  --name deckchatbot-api-backend \
  --resource-group deckchatbot-shell-rg \
  --runtime "NODE|18-lts"

# Explicitly set startup file
az webapp config set \
  --name deckchatbot-api-backend \
  --resource-group deckchatbot-shell-rg \
  --startup-file "server.js"

# Restart app
az webapp restart \
  --name deckchatbot-api-backend \
  --resource-group deckchatbot-shell-rg
```

### Test Endpoint

```
https://deckchatbot-api-backend.azurewebsites.net
```

---

## 🌐 Frontend Deployment (Azure Static Web Apps + GitHub)

### 1. Create Static Web App

```bash
az staticwebapp create \
  --name deckchatbot-frontend \
  --resource-group deckchatbot-shell-rg \
  --source https://github.com/alentwotime/deckchatbot-monorepo \
  --location "Central US" \
  --branch main \
  --app-location "client" \
  --output-location "dist"  # Use "build" if using CRA
```

### 2. Modify `vite.config.js` or `react-router` for Fallback Routing

**For Vite**:

```js
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { historyApiFallback: true },
});
```

**For CRA**:
Ensure `StaticWebApp.config.json` exists:

```json
{
  "routes": [
    { "route": "/", "serve": "/index.html", "statusCode": 200 },
    { "route": "/**", "serve": "/index.html", "statusCode": 200 }
  ]
}
```

Place this in `client/public/`.

---

## 🔗 Connect Frontend to Backend

In your React app:

```js
const API_BASE = "https://deckchatbot-api-backend.azurewebsites.net";
axios.get(`${API_BASE}/api/ping`);
```

---

## 🔐 Set Environment Variables (Backend)

```bash
az webapp config appsettings set \
  --name deckchatbot-api-backend \
  --resource-group deckchatbot-shell-rg \
  --settings OPENAI_API_KEY=sk-xxx
```

---

## 🌍 Add Custom Domain (Optional)

```bash
az staticwebapp hostname set \
  --name deckchatbot-frontend \
  --hostname www.deckchatbot.com

az webapp config hostname add \
  --webapp-name deckchatbot-api-backend \
  --resource-group deckchatbot-shell-rg \
  --hostname api.deckchatbot.com
```

Configure DNS records at your domain registrar (CNAME or A records).

---

## ✅ GitHub Actions (Auto Deployment)

Azure Static Web App sets up GitHub Actions automatically upon creation. Confirm under:

```
.github/workflows/azure-static-web-apps-<HASH>.yml
```

You can also manually trigger deploys or customize the workflow.

---

## 🚀 Success Checklist

* [x] Logged in with `az login`
* [x] Backend live at `deckchatbot-api-backend.azurewebsites.net`
* [x] Frontend live at `deckchatbot-frontend.azurestaticapps.net`
* [x] API connected via environment-based URL
* [x] GitHub pushes deploy automatically

---

## 🧼 Cleanup (if needed)

```bash
az staticwebapp delete --name deckchatbot-frontend --resource-group deckchatbot-shell-rg
az webapp delete --name deckchatbot-api-backend --resource-group deckchatbot-shell-rg
```

---

## 📬 Need Help?

Reach out via GitHub Issues or Azure Support if you're stuck.
