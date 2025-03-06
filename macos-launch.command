#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is not installed. Please install Node.js first."
    echo "Visit https://nodejs.org/ to download and install Node.js"
    read -p "Press Enter to exit..."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the server in the background
echo "Starting server..."
npm start &

# Wait for server to start (give it 2 seconds)
sleep 2

# Open the default browser
echo "Opening browser..."
open "http://localhost:3000"

# Keep the terminal window open
echo "Server is running. Press Ctrl+C to stop the server."
wait 