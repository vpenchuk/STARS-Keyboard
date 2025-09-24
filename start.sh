#!/bin/bash

echo "🚀 Starting STARS Keyboard Simulator..."
echo ""

# Start FDIO server in background
echo "📡 Starting FDIO server..."
cd "/Users/vlad/Desktop/FDIO"
node http-server.js &
FDIO_PID=$!

# Wait a moment for FDIO to start
sleep 2

# Start STARS HTTP server in background
echo "⌨️  Starting STARS keyboard server..."
cd "/Users/vlad/Desktop/STARS Keyboard"
python3 -m http.server 8080 &
STARS_PID=$!

# Wait a moment for server to start
sleep 2

# Open the application
echo "🌐 Opening STARS Keyboard Simulator..."
open "http://localhost:8080"

echo ""
echo "✅ Both servers are running:"
echo "   - FDIO: http://localhost:3001"
echo "   - STARS: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $FDIO_PID $STARS_PID; exit" INT
wait