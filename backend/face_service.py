import face_recognition
import numpy as np
import pickle
import cv2
from sqlalchemy.orm import Session
from .database import Student, StudentEncoding

def process_known_encodings(db: Session):
    # Fetch all encodings across all students
    all_encodings = db.query(StudentEncoding).all()
    known_encodings = []
    known_ids = []
    known_names = []
    
    # Pre-map student names for performance
    student_map = {s.id: s.name for s in db.query(Student.id, Student.name).all()}
    
    for enc_record in all_encodings:
        known_encodings.append(pickle.loads(enc_record.encoding))
        known_ids.append(enc_record.student_id)
        known_names.append(student_map.get(enc_record.student_id, "Unknown"))
        
    return known_encodings, known_ids, known_names

def create_encoding(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None: return None
    
    # Performance: Resize for faster detection during enrollment too
    small_img = cv2.resize(img, (0, 0), fx=0.5, fy=0.5)
    rgb_img = cv2.cvtColor(small_img, cv2.COLOR_BGR2RGB)
    
    locations = face_recognition.face_locations(rgb_img)
    if not locations:
        return None
        
    encodings = face_recognition.face_encodings(rgb_img, locations)
    return encodings[0] if encodings else None

def match_faces(db: Session, image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return []
        
    # PERFORMANCE: Resize to 1/4 for 4x speedup
    small_img = cv2.resize(img, (0, 0), fx=0.25, fy=0.25)
    rgb_img = cv2.cvtColor(small_img, cv2.COLOR_BGR2RGB)
    
    locations = face_recognition.face_locations(rgb_img)
    if not locations:
        return []
        
    encodings = face_recognition.face_encodings(rgb_img, locations)
    known_encodings, known_ids, known_names = process_known_encodings(db)
            
    results = []
    for (top, right, bottom, left), encoding in zip(locations, encodings):
        # RESCOPED VARIABLES: Each face has its own unique identification state
        face_name = "Unknown"
        face_student_id = None
        face_min_dist = 1.0
        
        # Scale back coordinates to original image size
        box_coords = [top * 4, right * 4, bottom * 4, left * 4]
        
        if known_encodings:
            # 1. COMPUTE ALL MATCHES (Compare faces)
            # Use a strict tolerance of 0.45 as requested
            face_matches = face_recognition.compare_faces(known_encodings, encoding, tolerance=0.45)
            
            # 2. COMPUTE ALL DISTANCES (Euclidean)
            face_distances = face_recognition.face_distance(known_encodings, encoding)
            
            # 3. IDENTIFY BEST CANDIDATE
            best_idx = np.argmin(face_distances)
            best_score = face_distances[best_idx]
            
            # 4. STRICT DUAL-VALIDATION
            # a) Must be flagged as a match by dlib
            # b) Distance must be strictly below the rejection threshold
            if face_matches[best_idx] and best_score < 0.45:
                face_student_id = known_ids[best_idx]
                face_name = known_names[best_idx]
                face_min_dist = best_score
            else:
                # REJECTION LOGIC: Borderline or mismatched faces are strictly UNKNOWN
                face_name = "Unknown"
                face_student_id = None
                
        results.append({
            "name": face_name,
            "student_id": face_student_id,
            "box": box_coords,
            "distance": float(face_min_dist)
        })
        
    return results
