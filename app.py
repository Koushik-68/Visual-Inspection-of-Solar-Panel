# # app.py
# import cv2
# from ultralytics import YOLO
# import json
# import base64
# import requests
# import time
# import os

# # Load both models
# fault_model = YOLO("model/best.pt")  # Fault detection model
# number_model = YOLO("model/num.pt")   # Number detection model

# # Start webcam capture
# cap = cv2.VideoCapture(0)

# if not cap.isOpened():
#     print("❌ Cannot access the webcam.")
#     exit()

# print("✅ Starting webcam...")
# print("Controls:")
# print("- Press 'q' to quit")

# # Create detections directory if it doesn't exist
# detections_dir = "detections"
# if not os.path.exists(detections_dir):
#     os.makedirs(detections_dir)

# # Variables for automatic saving
# last_save_time = time.time()
# SAVE_INTERVAL = 2  # Save every 2 seconds

# def get_fault_level(faults):
#     desc = faults.lower().replace('-', ' ')
#     if 'physical damage' in desc:
#         return 'high'
#     if 'dust' in desc or 'bird' in desc or 'drop' in desc or 'snow' in desc:
#         return 'medium'
#     if 'clean' in desc or 'no faults' in desc or 'healthy' in desc:
#         return 'low'
#     return 'low'  # Default to low if not matched

# def save_detection_data(detection_data):
#     try:
#         # Create filename with timestamp
#         timestamp = time.strftime("%Y%m%d_%H%M%S")
#         panel_id = detection_data.get('panelId', 'unknown_panel')
#         filename = f"detection_{panel_id.replace(' ', '_')}_{timestamp}.json"
#         filepath = os.path.join(detections_dir, filename)
        
#         # Save the detection data
#         with open(filepath, "w") as f:
#             json.dump(detection_data, f, indent=2)
#         print(f"✅ Detection result saved to {filepath}")
#         return True
#     except Exception as e:
#         print(f"❌ Error saving detection data: {str(e)}")
#         return False

# def send_detection_to_panel(detection_data, max_retries=3):
#     for attempt in range(max_retries):
#         try:
#             print(f"Attempting to send data (Attempt {attempt + 1}/{max_retries})...")
#             # Send POST request to the panel system
#             response = requests.post('http://localhost:3000/api/update-panel', 
#                                   json=detection_data,
#                                   timeout=10)  # Add timeout
            
#             if response.status_code == 200:
#                 print(f"✅ Detection data sent successfully for {detection_data['panelId']}")
#                 return True
#             else:
#                 print(f"❌ Failed to send detection data: {response.status_code}")
#                 print(f"Response: {response.text}")
#                 if attempt < max_retries - 1:
#                     print(f"Retrying... (Attempt {attempt + 2}/{max_retries})")
#                     time.sleep(1)  # Wait before retrying
#                 continue
                
#         except requests.exceptions.RequestException as e:
#             print(f"❌ Error sending detection data: {str(e)}")
#             if attempt < max_retries - 1:
#                 print(f"Retrying... (Attempt {attempt + 2}/{max_retries})")
#                 time.sleep(1)  # Wait before retrying
#             continue
    
#     print("❌ All retry attempts failed. Data saved locally only.")
#     return False

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         print("❌ Failed to grab frame.")
#         break

#     # Run fault detection
#     fault_results = fault_model(frame, stream=True)

#     # Draw results and collect faults
#     faults = []
#     for r in fault_results:
#         for box in r.boxes:
#             # Get bounding box coordinates
#             x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
#             conf = box.conf[0]
#             cls = box.cls[0]
#             label = fault_model.names[int(cls)]
#             if conf >= 0.5:  # Only include faults with confidence >= 0.5
#                 faults.append(f"{label} ({conf:.2f})")
#                 # Draw box
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                 cv2.putText(
#                     frame,
#                     f'{label} {conf:.2f}',
#                     (x1, y1 - 10),
#                     cv2.FONT_HERSHEY_SIMPLEX,
#                     0.6,
#                     (0, 255, 0),
#                     2
#                 )

#     # Run number detection and draw results
#     number_results = number_model(frame, conf=0.5)
#     detected_panel_id = None
    
#     for result in number_results:
#         boxes = result.boxes
#         if boxes is not None:
#             for box in boxes:
#                 x1, y1, x2, y2 = map(int, box.xyxy[0])
#                 cls_id = int(box.cls[0])
#                 conf = float(box.conf[0])
#                 number = number_model.names[cls_id]
                
#                 # Draw box and label in blue color
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
#                 cv2.putText(
#                     frame,
#                     f"Panel {number} ({conf:.2f})",
#                     (x1, y1 - 10),
#                     cv2.FONT_HERSHEY_SIMPLEX,
#                     0.7,
#                     (255, 0, 0),
#                     2
#                 )
                
#                 # Store the detected panel number with highest confidence
#                 if detected_panel_id is None or conf > detected_panel_id[1]:
#                     detected_panel_id = (f"Panel {number}", conf)

#     # Show output frame
#     cv2.imshow("Solar Panel Inspection System", frame)

#     # Automatically save and send detection if we have both panel ID and faults
#     current_time = time.time()
#     if detected_panel_id and faults and current_time - last_save_time >= SAVE_INTERVAL:
#         try:
#             # Encode image to base64
#             _, buffer = cv2.imencode('.jpg', frame)
#             img_b64 = base64.b64encode(buffer).decode('utf-8')
            
#             # Add data URL prefix
#             img_data_url = f"data:image/jpeg;base64,{img_b64}"

#             # Prepare detection data
#             level = get_fault_level(", ".join(faults))
#             panel_id = detected_panel_id[0]
            
#             detection_data = {
#                 "panelId": panel_id,
#                 "faults": ", ".join(faults),
#                 "level": level,
#                 "image": img_data_url
#             }

#             # First save the detection data locally
#             if save_detection_data(detection_data):
#                 # Then try to send to the server
#                 send_detection_to_panel(detection_data)
#                 last_save_time = current_time
#             else:
#                 print("❌ Failed to save detection data")

#         except Exception as e:
#             print(f"❌ Error processing detection: {str(e)}")

#     # Check for quit key
#     key = cv2.waitKey(1) & 0xFF
#     if key == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows() 