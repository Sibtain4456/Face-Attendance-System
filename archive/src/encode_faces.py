import face_recognition
import os
import pickle

DATASET_DIR = "dataset"
ENCODINGS_DIR = "encodings"
ENCODING_FILE = os.path.join(ENCODINGS_DIR, "face_encodings.pkl")

os.makedirs(ENCODINGS_DIR, exist_ok=True)

known_encodings = []
known_names = []

print("[INFO] Starting face encoding...")

for person_name in os.listdir(DATASET_DIR):
    person_path = os.path.join(DATASET_DIR, person_name)

    if not os.path.isdir(person_path):
        continue

    print(f"[INFO] Processing {person_name}")

    for img_name in os.listdir(person_path):
        img_path = os.path.join(person_path, img_name)

        image = face_recognition.load_image_file(img_path)
        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            print(f"[WARNING] No face found in {img_path}")
            continue

        known_encodings.append(encodings[0])
        known_names.append(person_name)

print("[INFO] Encoding completed")

data = {
    "encodings": known_encodings,
    "names": known_names
}

with open(ENCODING_FILE, "wb") as f:
    pickle.dump(data, f)

print(f"[INFO] Encodings saved to {ENCODING_FILE}")
print(f"[INFO] Total encodings: {len(known_encodings)}")
