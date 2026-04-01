import cv2
from ultralytics import YOLO
import json
import base64
import requests
import time
import os

# Load both models
fault_model = YOLO("model/best.pt")  # Fault detection model
number_model = YOLO("model/num.pt")   # Number detection model

# Start webcam capture
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Cannot access the webcam.")
    exit()

print("✅ Starting webcam...")
print("Controls:")
print("- Press SPACE to capture & send detection")
print("- Press 'q' to quit")

# Create detections directory if it doesn't exist
detections_dir = "detections"
if not os.path.exists(detections_dir):
    os.makedirs(detections_dir)

def get_fault_level(faults):
    desc = faults.lower().replace('-', ' ')
    if 'physical damage' in desc:
        return 'high'
    if 'dust' in desc or 'bird' in desc or 'drop' in desc or 'snow' in desc:
        return 'medium'
    if 'clean' in desc or 'no faults' in desc or 'healthy' in desc:
        return 'low'
    return 'low'  # Default to low if not matched

def save_detection_data(detection_data):
    try:
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        panel_id = detection_data.get('panelId', 'unknown_panel')
        filename = f"detection_{panel_id.replace(' ', '_')}_{timestamp}.json"
        filepath = os.path.join(detections_dir, filename)
        with open(filepath, "w") as f:
            json.dump(detection_data, f, indent=2)
        print(f"✅ Detection result saved to {filepath}")
        return True
    except Exception as e:
        print(f"❌ Error saving detection data: {str(e)}")
        return False

def send_detection_to_panel(detection_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            print(f"Attempting to send data (Attempt {attempt + 1}/{max_retries})...")
            response = requests.post('http://localhost:3000/api/update-panel', 
                                  json=detection_data,
                                  timeout=10)
            if response.status_code == 200:
                print(f"✅ Detection data sent successfully for {detection_data['panelId']}")
                return True
            else:
                print(f"❌ Failed to send detection data: {response.status_code}")
                print(f"Response: {response.text}")
                if attempt < max_retries - 1:
                    print(f"Retrying... (Attempt {attempt + 2}/{max_retries})")
                    time.sleep(1)
                continue
        except requests.exceptions.RequestException as e:
            print(f"❌ Error sending detection data: {str(e)}")
            if attempt < max_retries - 1:
                print(f"Retrying... (Attempt {attempt + 2}/{max_retries})")
                time.sleep(1)
            continue
    print("❌ All retry attempts failed. Data saved locally only.")
    return False

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to grab frame.")
        break

    # Run fault detection
    fault_results = fault_model(frame, stream=True)
    faults = []
    for r in fault_results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            conf = box.conf[0]
            cls = box.cls[0]
            label = fault_model.names[int(cls)]
            if conf >= 0.5:
                faults.append(f"{label} ({conf:.2f})")
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    frame,
                    f'{label}',
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )

    # Run number detection and draw results
    number_results = number_model(frame, conf=0.5)
    digits = []
    for result in number_results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                digit = number_model.names[cls_id]
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(
                    frame,
                    f"{digit}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 0, 0),
                    2
                )
                if conf >= 0.5:
                    digits.append((x1, digit))
    # Sort digits by x-coordinate and concatenate
    if digits:
        digits.sort(key=lambda tup: tup[0])  # Sort by x1 (left to right)
        panel_number = ''.join([d[1] for d in digits])
        detected_panel_id = (f"Panel {panel_number}", 1.0)
    else:
        detected_panel_id = None

    # Show output frame
    cv2.imshow("Solar Panel Inspection System", frame)

    # Wait for key press
    key = cv2.waitKey(1) & 0xFF

    # --- NEW BEHAVIOR: SPACE BAR CAPTURE ---
    if key == 32:  # Space bar pressed
        if detected_panel_id and faults:
            try:
                _, buffer = cv2.imencode('.jpg', frame)
                img_b64 = base64.b64encode(buffer).decode('utf-8')
                img_data_url = f"data:image/jpeg;base64,{img_b64}"
                level = get_fault_level(", ".join(faults))
                panel_id = detected_panel_id[0]
                detection_data = {
                    "panelId": panel_id,
                    "faults": ", ".join(faults),
                    "level": level,
                    "image": img_data_url
                }
                if save_detection_data(detection_data):
                    send_detection_to_panel(detection_data)
                else:
                    print("❌ Failed to save detection data")
            except Exception as e:
                print(f"❌ Error processing detection: {str(e)}")
        else:
            print("⚠️ No panel number or fault detected. Try again when both are visible.")

    # Quit
    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
