# AI-Powered Face Detection and Attendance Recording System

> **Abstract** : The project automates attendance by detecting and recognizing student faces using computer vision techniques.
It reduces manual effort, prevents proxy attendance, and ensures accurate real-time records

### Project Members
1. KHAN MOHD SIBTAIN RAZA [ Team Leader ]
2. KHAN MOHAMMAD BASHARAT MOHAMMAD HAYAT  
3. SHAIKH MOHAMMAD FAIYAZ 

### Project Guides
1. PROF. SACHIN CHARBHE  [ Primary Guide ] 

### Deployment Steps
Follow these steps to set up and run the project locally:

1. **Clone the Repository**
   ```bash
   git clone <https://github.com/Sibtain4456/Face-Attendance-System.git>
   cd Face_Attendance_System
   ```

2. **Backend Setup**
   - Create and activate a virtual environment:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Install required Python packages:
     ```bash
     pip install -r requirements.txt
     ```

3. **Frontend Setup**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```

4. **Running the System**
   - From the root directory, run the batch script:
     ```powershell
     .\run_app.bat
     ```
   - Or start manually:
     - **Backend**: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
     - **Frontend**: `cd frontend && npm run dev`

5. **Access the Application**
   - Open your browser and go to: `http://localhost:5173`


### Subject Details
- Class : SE (AI&DS) Div A - 2025-2026
- Subject : Mini Project (MP)
- Project Type : Mini Project

### Platform, Libraries and Frameworks used
1. **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
2. **Web Server**: [Uvicorn](https://www.uvicorn.org/)
3. **Computer Vision**: [OpenCV](https://opencv.org/) & [face-recognition](https://github.com/ageitgey/face_recognition) (dlib)
4. **Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with SQLite
5. **Frontend**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
6. **Data Visualization**: [Recharts](https://recharts.org/)
7. **Icons**: [Lucide React](https://lucide.dev/)

### Dataset Used
The system utilizes a **Self-Curated Dataset**. Student face encodings are captured and generated in real-time during the enrollment process and stored securely in the local SQLite database.

### References
- [Face Recognition Library Documentation](https://github.com/ageitgey/face_recognition)
- [FastAPI Framework Web Docs](https://fastapi.tiangolo.com/)
- [Modern React Documentation](https://react.dev/)
- [Vite Next Generation Frontend Tooling](https://vitejs.dev/)
