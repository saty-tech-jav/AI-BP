#!/bin/bash
echo "============================================"
echo "  VitalTrack BP Tracker - Startup Script"
echo "============================================"
echo ""

# Start Backend
echo "[1/2] Starting Backend (Spring Boot)..."
cd "$(dirname "$0")/backend"
mvn spring-boot:run &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

echo "Waiting for backend to initialize (15s)..."
sleep 15

# Start Frontend
echo "[2/2] Starting Frontend (React)..."
cd "$(dirname "$0")/frontend"
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  App is running!"
echo "  Backend : http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo "  Demo Login: demo / demo123"
echo "  Press Ctrl+C to stop both servers"
echo "============================================"

# Wait and cleanup on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM
wait
