@echo off
echo Starting Face Attendance System...

echo Starting Backend Server (FastAPI)...
start cmd /k ".\venv\Scripts\activate && uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend Server (Vite + React)...
cd frontend
start cmd /k "npm run dev"

echo Servers are launching... Please wait a few seconds and then check your browser at http://localhost:5173
