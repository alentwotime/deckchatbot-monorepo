#!/bin/sh
# Start the Node.js backend server
echo "Starting backend server..."
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Check for possible entry point files
if [ -f "server.js" ]; then
    echo "server.js exists"
    echo "Running node server.js directly..."
    exec node server.js
elif [ -f "index.js" ]; then
    echo "index.js exists"
    echo "Running node index.js..."
    exec node index.js
elif [ -f "dist/index.js" ]; then
    echo "dist/index.js exists"
    echo "Running node dist/index.js..."
    exec node dist/index.js
elif [ -f "dist/server.js" ]; then
    echo "dist/server.js exists"
    echo "Running node dist/server.js..."
    exec node dist/server.js
else
    echo "ERROR: No entry point file found (tried server.js, index.js, dist/index.js, dist/server.js)!"
    echo "Available files:"
    find . -type f -name "*.js" | sort
    exit 1
fi
