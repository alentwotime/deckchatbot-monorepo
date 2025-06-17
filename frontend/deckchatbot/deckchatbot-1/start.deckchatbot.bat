@echo off
title DeckChatbot Launcher 🚀
echo Starting DeckChatbot server...

REM Navigate to the project folder
cd /d "%~dp0"

REM Start the server in a new terminal window
REM Prefer local nodemon if available, fallback to npx
if exist node_modules\.bin\nodemon (
	start "Server" cmd /k "node_modules\.bin\nodemon server.js"
) else (
	start "Server" cmd /k "npx nodemon server.js"
)

REM Open the browser to the local server URL
start "" http://localhost:3000

REM If NO_PAUSE is not defined, pause at the end for user to see output.
if not defined NO_PAUSE pause
