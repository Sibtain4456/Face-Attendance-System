import cv2
import os

print("Starting capture script...")

name = "faiyaz"
save_path = f"dataset/{name}"
os.makedirs(save_path, exist_ok=True)

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Camera not opened")
    exit()

count = len(os.listdir(save_path))


while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    cv2.imshow("Capture Faces - Press C to Capture, Q to Quit", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('c'):
        cv2.imwrite(f"{save_path}/{count}.jpg", frame)
        print(f"Saved image {count}")
        count += 1

    if key == ord('q') or count >= 25:
        break

cap.release()
cv2.destroyAllWindows()
print("Capture finished")
