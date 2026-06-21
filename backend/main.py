from fastapi import FastAPI, Depends, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date, time
import pickle
import jwt
import time as time_module
from passlib.context import CryptContext
import os

from typing import List, Dict
from collections import defaultdict
from .database import engine, Base, SessionLocal, Student, StudentEncoding, AttendanceRecord, Admin, Alert, SuspiciousActivity
from .face_service import create_encoding, match_faces

# Stability tracking: Map student_id -> count of consecutive detections
stability_tracker: Dict[int, int] = defaultdict(int)
STABILITY_THRESHOLD = 3 # Number of consecutive frames needed

# Session tracking: Set of student_ids already marked in this session
marked_in_session: set = set()

Base.metadata.create_all(bind=engine)

SECRET_KEY = "super_secret_enterprise_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI(title="Enterprise IAS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Utils ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise credentials_exception
    return admin

def seed_admin():
    db = SessionLocal()
    if db.query(Admin).count() == 0:
        default_admin = Admin(username="admin", hashed_password=get_password_hash("admin"))
        db.add(default_admin)
        db.commit()
    db.close()

seed_admin()

def migrate_old_encodings():
    """Migrate encodings from old Student schema to new StudentEncoding table."""
    db = SessionLocal()
    try:
        # Check if we need to migrate by checking if StudentEncoding is empty but Students exist
        if db.query(StudentEncoding).count() == 0 and db.query(Student).count() > 0:
            print("Running encoding migration...")
            # We use text() to query the old column if it still exists in the DB but not in the model
            from sqlalchemy import text
            students = db.execute(text("SELECT id, encoding FROM students WHERE encoding IS NOT NULL")).all()
            for s_id, s_enc in students:
                db.add(StudentEncoding(student_id=s_id, encoding=s_enc))
            db.commit()
            print(f"Migrated {len(students)} student encodings.")
    except Exception as e:
        print(f"Migration error (this is normal if columns are already gone): {e}")
    finally:
        db.close()

migrate_old_encodings()

# --- Routes ---
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/recognize")
async def recognize_faces(
    camera_id: str = Form("default"),
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    start_time = time_module.time()
    contents = await file.read()
    
    # 1. Detection & Recognition Pipeline
    results = match_faces(db, contents)
    
    today = datetime.now().date()
    now_dt = datetime.now()
    now_time = now_dt.time()
    
    # 2. Attendance Processing with Stability Check
    current_ids = set()
    for res in results:
        student_id = res["student_id"]
        if student_id:
            current_ids.add(student_id)
            stability_tracker[student_id] += 1
            
            # Reset other counters (optional, but keep it simple)
            # Only process if threshold reached
            if stability_tracker[student_id] >= STABILITY_THRESHOLD:
                # 5 minute anti-spam window
                existing = db.query(AttendanceRecord).filter(
                    AttendanceRecord.student_id == student_id,
                    AttendanceRecord.date == today
                ).order_by(AttendanceRecord.time.desc()).first()
                
                if not existing or (now_dt - datetime.combine(today, existing.time)).total_seconds() > 300:
                    new_record = AttendanceRecord(student_id=student_id, date=today, time=now_time)
                    db.add(new_record)
                    # Reset tracker after successful marking to avoid double-firing in next frame
                    stability_tracker[student_id] = 0
        else:
            # If a face is "Unknown", we could potentially reset counters for everyone to be strict
            # but usually we just let them decay or stay as is.
            pass

    # Decay tracker for students not seen in this frame
    for sid in list(stability_tracker.keys()):
        if sid not in current_ids:
            stability_tracker[sid] = max(0, stability_tracker[sid] - 1)
            
    db.commit()

    process_time = round((time_module.time() - start_time) * 1000, 2)
    return {
        "results": results, 
        "process_time_ms": process_time,
        "warnings": []
    }

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    total_students = db.query(Student).count()
    if total_students == 0:
        return {"trends": [], "at_risk": [], "totals": 0}
        
    dates = []
    trend_counts = []
    
    # Last 7 Days trend
    base = datetime.now().date()
    for i in range(6, -1, -1):
        target = base - timedelta(days=i)
        dates.append(target.strftime("%b %d"))
        cnt = db.query(AttendanceRecord).filter(AttendanceRecord.date == target).count()
        trend_counts.append(cnt)
        
    # At-risk students (< 75% attendance overall)
    # Total active days:
    distinct_days = db.query(AttendanceRecord.date).distinct().count()
    if distinct_days == 0:
        distinct_days = 1
        
    threshold = 0.75 * distinct_days
    
    # Find attendance counts per student
    student_records = db.query(AttendanceRecord.student_id, func.count(AttendanceRecord.id).label('total'))\
                        .group_by(AttendanceRecord.student_id).all()
                        
    record_map = {r.student_id: r.total for r in student_records}
    
    at_risk = []
    all_students = db.query(Student).all()
    for s in all_students:
        att_cnt = record_map.get(s.id, 0)
        perc = (att_cnt / distinct_days) * 100
        if perc < 75:
            at_risk.append({"id": s.id, "name": s.name, "percentage": round(perc, 1)})
            # Generate alert if critical
            if perc < 50:
                # Check if alert already exists
                existing = db.query(Alert).filter(Alert.student_id == s.id, Alert.is_resolved == False).first()
                if not existing:
                    db.add(Alert(type="Attendance", student_id=s.id, message=f"Critical: {s.name} attendance dropped to {round(perc,1)}%"))
    
    db.commit()
    
    return {
        "trends": [{"name": dates[i], "attendance": trend_counts[i]} for i in range(7)],
        "at_risk": at_risk,
        "totals": total_students
    }

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Alert).filter(Alert.is_resolved == False).order_by(Alert.created_at.desc()).limit(10).all()

@app.post("/api/alerts/{alert_id}/dismiss")
def dismiss_alert(alert_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_resolved = True
        db.commit()
    return {"status": "ok"}

@app.post("/api/attendance/{record_id}/edit")
def edit_attendance(record_id: int, status: str = Form(...), db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = status
    record.is_manual = True
    record.edited_by = current_admin.username
    db.commit()
    return {"status": "ok"}


# ---- Original endpoints remaining ----
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    total_students = db.query(Student).count()
    today = datetime.now().date()
    present_today = db.query(AttendanceRecord).filter(AttendanceRecord.date == today).count()
    return {"total_students": total_students, "present_today": present_today}

@app.get("/api/students")
def get_students(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    students = db.query(Student).all()
    return [{"id": s.id, "name": s.name, "branch": s.branch} for s in students]

@app.post("/api/students")
async def register_student(
    name: str = Form(...), 
    branch: str = Form(...), 
    files: List[UploadFile] = File(...), # Support multiple files
    db: Session = Depends(get_db), 
    current_admin: Admin = Depends(get_current_admin)
):
    new_student = Student(name=name, branch=branch)
    db.add(new_student)
    db.flush() # Get student ID
    
    encodings_added = 0
    for file in files:
        contents = await file.read()
        encoding = create_encoding(contents)
        if encoding is not None:
            db.add(StudentEncoding(student_id=new_student.id, encoding=pickle.dumps(encoding)))
            encodings_added += 1
            
    if encodings_added == 0:
        db.rollback()
        raise HTTPException(status_code=400, detail="No detectable faces found in any uploaded image.")
        
    db.commit()
    return {"message": "Success", "id": new_student.id, "encodings_added": encodings_added}

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).delete()
    db.query(Student).filter(Student.id == student_id).delete()
    db.commit()
    return {"message": "Deleted"}

@app.get("/api/attendance")
def get_attendance(date: str = None, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    query = db.query(AttendanceRecord, Student.name, Student.branch)\
        .join(Student, AttendanceRecord.student_id == Student.id)
    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(AttendanceRecord.date == filter_date)
        except ValueError:
            pass
    records = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.time.desc()).all()
    
    return [{
        "id": r.id, "student_id": r.student_id, "name": n, "branch": b,
        "date": r.date.isoformat(), "time": r.time.strftime("%H:%M:%S"), 
        "status": r.status, "is_manual": r.is_manual, "edited_by": r.edited_by
    } for r, n, b in records]
