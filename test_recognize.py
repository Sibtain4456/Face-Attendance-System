import urllib.request
import urllib.error
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.text import MIMEText
import uuid
import sys

def post_multipart(url, filepath):
    boundary = uuid.uuid4().hex
    body = bytearray()
    
    with open(filepath, 'rb') as f:
        file_content = f.read()

    body.extend(f'--{boundary}\r\n'.encode())
    body.extend(b'Content-Disposition: form-data; name="file"; filename="0.jpg"\r\n')
    body.extend(b'Content-Type: image/jpeg\r\n\r\n')
    body.extend(file_content)
    body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode())

    req = urllib.request.Request(url, data=body)
    req.add_header('Content-type', f'multipart/form-data; boundary={boundary}')

    try:
        response = urllib.request.urlopen(req)
        print(response.getcode())
        print(response.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print(e.read().decode())
    except Exception as e:
        print("Error:", e)

post_multipart('http://localhost:8000/api/recognize', 'archive/dataset/Sibtain/0.jpg')
