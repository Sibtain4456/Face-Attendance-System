import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Date, Time, LargeBinary, DateTime, Boolean, text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./attendance.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
# Enable SQLite WAL Mode for active concurrency
with engine.connect() as con:
    con.execute(text("PRAGMA journal_mode=WAL;"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    branch = Column(String)
    # Support for multiple encodings
    encodings = relationship("StudentEncoding", back_populates="student", cascade="all, delete-orphan")

class StudentEncoding(Base):
    __tablename__ = "student_encodings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    encoding = Column(LargeBinary, nullable=False)
    
    student = relationship("Student", back_populates="encodings")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, index=True)
    date = Column(Date, index=True)
    time = Column(Time)
    status = Column(String, default="Present")
    is_manual = Column(Boolean, default=False)
    edited_by = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # "System", "Fraud", "Attendance"
    message = Column(String)
    student_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)

class SuspiciousActivity(Base):
    __tablename__ = "suspicious_activities"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # "Multiple Faces", "Liveness Fail", "Rapid Marking"
    frame_time = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True)

class Admin(Base):

    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

Base.metadata.create_all(bind=engine)

