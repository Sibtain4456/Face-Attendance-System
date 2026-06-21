import requests
import os

url = "http://localhost:8000/api/recognize"
test_image = r"c:\Users\Raza\Desktop\Face_Attendance_System\archive\dataset\Sibtain\0.jpg"

if os.path.exists(test_image):
    with open(test_image, "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        data = {"camera_id": "test_script"}
        try:
            r = requests.post(url, files=files, data=data)
            print("Status Code:", r.status_code)
            print("Response:", r.json())
        except Exception as e:
            print("Error connecting to backend:", e)
else:
    print("Test image not found at", test_image)
