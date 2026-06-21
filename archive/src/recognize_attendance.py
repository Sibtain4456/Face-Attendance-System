import cv2
import face_recognition
import pickle
import numpy as np
import csv
from datetime import datetime
import os

# Name → Branch mapping
BRANCH_MAP = {
    "Sibtain": "AI & Data Science",
    "basharat": "AI & Data Science",
    "faiyaz": "Computer Science",
    "fardin": "Mechanical Engineering"
}

# Load face encodings
with open("encodings/face_encodings.pkl", "rb") as f:
    data = pickle.load(f)

known_encodings = data["encodings"]
known_names = data["names"]

# Attendance setup
ATTENDANCE_DIR = "attendance"
os.makedirs(ATTENDANCE_DIR, exist_ok=True)

today = datetime.now().strftime("%Y-%m-%d")
attendance_file = f"{ATTENDANCE_DIR}/attendance_{today}.csv"

marked_names = set()

# Load already marked names from CSV (if exists)
if os.path.exists(attendance_file):
    with open(attendance_file, "r") as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            marked_names.add(row[0])

def sort_csv_by_time(csv_file):
    with open(csv_file, "r", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    rows.sort(key=lambda x: x[3])  # Time column index

    with open(csv_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

def generate_daily_summary(all_students, present_students, date):
    summary_file = f"attendance/summary_{date}.txt"

    absent_students = sorted(set(all_students) - set(present_students))

    with open(summary_file, "w") as f:
        f.write(f"Attendance Summary - {date}\n")
        f.write("=" * 30 + "\n")
        f.write(f"Total Students : {len(all_students)}\n")
        f.write(f"Present        : {len(present_students)}\n")
        f.write(f"Absent         : {len(absent_students)}\n\n")

        f.write("Present Students:\n")
        for name in sorted(present_students):
            f.write(f"- {name}\n")

        f.write("\nAbsent Students:\n")
        for name in absent_students:
            f.write(f"- {name}\n")
def generate_daily_summary(all_students, present_students, date):
    summary_file = f"attendance/summary_{date}.txt"

    absent_students = sorted(set(all_students) - set(present_students))

    with open(summary_file, "w") as f:
        f.write(f"Attendance Summary - {date}\n")
        f.write("=" * 30 + "\n")
        f.write(f"Total Students : {len(all_students)}\n")
        f.write(f"Present        : {len(present_students)}\n")
        f.write(f"Absent         : {len(absent_students)}\n\n")

        f.write("Present Students:\n")
        for name in sorted(present_students):
            f.write(f"- {name}\n")

        f.write("\nAbsent Students:\n")
        for name in absent_students:
            f.write(f"- {name}\n")


# Create attendance file if not exists
# Create attendance file if not exists
if not os.path.exists(attendance_file):
    with open(attendance_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Branch", "Date", "Time", "Status"])

marked_names = set()

# Load already marked names from CSV (if exists)
if os.path.exists(attendance_file):
    with open(attendance_file, "r") as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            marked_names.add(row[0])

print("[INFO] Starting Face Attendance System...")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Camera not accessible")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        distances = face_recognition.face_distance(known_encodings, face_encoding)
        min_distance = np.min(distances)
        best_match_index = np.argmin(distances)

        name = "Unknown"

        if min_distance < 0.5:
            name = known_names[best_match_index]

            if name not in marked_names:
                marked_names.add(name)
                time_now = datetime.now().strftime("%H:%M:%S")

                with open(attendance_file, "a", newline="") as f:
                    writer = csv.writer(f)
                    branch = BRANCH_MAP.get(name, "Unknown")
                    writer.writerow([name, branch, today, time_now, "Present"])


                print(f"[INFO] Attendance marked for {name}")
                sort_csv_by_time(attendance_file)


        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)

        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(frame, name, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    cv2.imshow("Face Attendance System", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

all_students = set(known_names)
present_students = set(marked_names)
generate_daily_summary(all_students, present_students, today)

cap.release()
cv2.destroyAllWindows()
print("[INFO] Program ended")