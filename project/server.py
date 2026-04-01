import cv2
from ultralytics import YOLO
import json
import base64
import socket
import pickle
import time
import os

# Load models
fault_model = YOLO("model/best.pt")
number_model = YOLO("model/num.pt")

def get_fault_level(faults):
    desc = faults.lower().replace('-', ' ')
    if 'physical damage' in desc:
        return 'high'
    if 'dust' in desc or 'bird' in desc or 'drop' in desc or 'snow' in desc:
        return 'medium'
    if 'clean' in desc or 'no faults' in desc or 'healthy' in desc:
        return 'low'
    return 'low'

def process_frame(frame):
    faults = []
    detected_panel_id = None
    
    # Process faults
    fault_results = fault_model(frame, stream=True)
    for r in fault_results:
        for box in r.boxes:
            conf = box.conf[0]
            cls = box.cls[0]
            label = fault_model.names[int(cls)]
            if conf >= 0.5:
                faults.append(f"{label} ({conf:.2f})")
    
    # Process panel numbers
    number_results = number_model(frame, conf=0.5)
    digits = []
    for result in number_results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                x1 = int(box.xyxy[0][0])
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                if conf >= 0.5:
                    digit = number_model.names[cls_id]
                    digits.append((x1, digit))
    
    if digits:
        digits.sort(key=lambda tup: tup[0])
        panel_number = ''.join([d[1] for d in digits])
        detected_panel_id = (f"Panel {panel_number}", 1.0)
        
    return faults, detected_panel_id

def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('0.0.0.0', 5000))
    server_socket.listen(1)
    print("Waiting for laptop connection...")
    return server_socket

def main():
    server_socket = start_server()
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Cannot access the camera.")
        return

    client_socket, addr = server_socket.accept()
    print(f"Connected to laptop at {addr}")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Process frame
        faults, detected_panel_id = process_frame(frame)

        # Check for capture command from laptop
        try:
            command = client_socket.recv(1024).decode()
            if command == "CAPTURE":
                if detected_panel_id and faults:
                    _, buffer = cv2.imencode('.jpg', frame)
                    img_b64 = base64.b64encode(buffer).decode('utf-8')
                    detection_data = {
                        "panelId": detected_panel_id[0],
                        "faults": ", ".join(faults),
                        "level": get_fault_level(", ".join(faults)),
                        "image": f"data:image/jpeg;base64,{img_b64}"
                    }
                    # Send detection data to laptop
                    client_socket.send(pickle.dumps(detection_data))
                else:
                    client_socket.send(pickle.dumps(None))
            elif command == "QUIT":
                break
        except socket.error:
            break

    cap.release()
    client_socket.close()
    server_socket.close()

if __name__ == "__main__":
    main()