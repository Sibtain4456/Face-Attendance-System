# Professional Face Attendance System Upgrade

This plan outlines the architecture and steps to convert the existing face attendance prototype (Python scripts with CSV storage) into a robust, professional product featuring a web dashboard, real-time video streaming, and a proper database.

## User Review Required

> [!IMPORTANT]
> The original prototype relies on local CSV files, a hardcoded dictionary (`BRANCH_MAP`), and separate python scripts. This plan transitions the system to a structured web application format. Note that this new format is substantially more advanced and requires using modern robust technologies.

## Proposed Architecture

1. **Database Layer (SQLite & SQLAlchemy)**
   - Transition from CSV to a relational database to prevent duplicates and enable complex queries (e.g., historical attendance reporting).
   - **Models**: `Student` (Name, Branch, etc.), `AttendanceRecord` (Student, Date, Time), `StudentEncoding` (Binary array/Pickle of the 128D encoding).

2. **Backend Layer (FastAPI - Python)**
   - Fast, modern backend to handle API routing, state management, and real-time processing.
   - **Video Streaming Endpoint**: The backend will connect to the local webcam (`cv2.VideoCapture`), overlay boxes/names on the frame, and yield an MJPEG stream to the frontend via a `StreamingResponse`. Wait, I want to confirm if you want the backend to open the local server camera or the frontend to pass the user's browser camera.
   - **REST APIs**: Endpoints to list students, register a new student (handling photo upload and `face_recognition.face_encodings`), and retrieve attendance data.

3. **Frontend Dashboard (Vite + React + Vanilla CSS)**
   - A beautiful, dynamic web application designed with modern principles (glassmorphism, curated color palettes, Google Fonts like 'Inter').
   - **Pages**:
     - **Dashboard**: Real-time stats (Total Students, Present Today).
     - **Live Feed**: A large video player displaying the live camera feed with real-time recognition.
     - **Students Management**: Table to view, add, or delete registered students, and upload their face datasets.
     - **Reports**: Data tables to view and export historical attendance records.

## Proposed Changes

### Database & Backend (Python)
#### [NEW] `backend/database.py` (SQLAlchemy setup and models)
#### [NEW] `backend/main.py` (FastAPI app, routes, and video streaming logic)
#### [NEW] `backend/face_service.py` (Encapsulates logic from `encode_faces.py` and `recognize_attendance.py`)

### Frontend App (JS/React)
#### [NEW] `frontend/` (Vite + React application initialized with `npx create-vite`)
#### [NEW] `frontend/index.css` (Comprehensive CSS variables, responsive design, and animations based on vanilla CSS constraints)
#### [NEW] `frontend/src/App.jsx` (Application routes and layout)

### Deployment & Tooling
#### [MODIFY] `requirements.txt`
Update to include `fastapi`, `uvicorn`, `sqlalchemy`, `opencv-python`, `face-recognition`, and `python-multipart`.
#### [DELETE] `src/capture_faces.py`, `src/encode_faces.py`, `src/recognize_attendance.py`
These will be adapted and replaced by the new architecture.

## Open Questions

> [!WARNING]
> Please provide your feedback on the following before we proceed.

1. **Camera Architecture**: Should the backend process the webcam directly and broadcast the video to the dashboard? (Recommended if the camera is plugged into the server/PC running the system). Or do you want the frontend to use the user's browser camera and send frames to the server?
2. **Existing Data**: Are we okay to start fresh with a new Database and clear out the old CSV files/encodings? The new UI will allow you to quickly register students again.
3. **Framework**: I have proposed Vite + React for the frontend paired with a FastAPI Python backend. This cleanly separates the frontend from the AI logic. Are you okay with this stack?

## Verification Plan

### Automated Tests
- Fastapi startup logging to ensure camera binding operates successfully.

### Manual Verification
- View the UI dashboard to ensure it matches "vibrant, premium" design criteria.
- Register a face through the dashboard.
- Enable the live feed and ensure the recognized face marks attendance in the database.
