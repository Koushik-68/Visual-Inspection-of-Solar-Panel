# import os
# import io
# import json
# import base64
# import time
# import requests
# import cv2
# import numpy as np
# from PIL import Image
# from flask import Flask, jsonify, request, render_template_string
# from flask_cors import CORS
# from googleapiclient.discovery import build
# from google.oauth2 import service_account
# from googleapiclient.http import MediaIoBaseDownload
# from ultralytics import YOLO

# # === CONFIGURATION ===
# SERVICE_ACCOUNT_FILE = r'C:\Users\Admin\Downloads\plexiform-bot-446507-f4-a76a05de5300.json'
# FOLDER_ID = '1m8LAKEib1smUjqeQ7XtcHFSnwtwVI6rV'
# OUTPUT_JSON = 'panel_results.json'

# # === GOOGLE DRIVE SETUP ===
# SCOPES = ['https://www.googleapis.com/auth/drive']
# creds = service_account.Credentials.from_service_account_file(
#     SERVICE_ACCOUNT_FILE, scopes=SCOPES)
# service = build('drive', 'v3', credentials=creds)

# # === YOLO MODELS ===
# fault_model = YOLO('model/best.pt')
# panel_number_model = YOLO('model/num.pt')

# # === FLASK APP ===
# app = Flask(__name__)
# CORS(app)

# # === HTML PAGE (simple button) ===
# HTML_PAGE = """
# <!DOCTYPE html>
# <html lang="en">
# <head>
#     <meta charset="UTF-8">
#     <title>Solar Panel Inspection</title>
#     <style>
#         body {
#             font-family: Arial, sans-serif;
#             background: #f4f6f8;
#             display: flex;
#             flex-direction: column;
#             align-items: center;
#             justify-content: center;
#             height: 100vh;
#         }
#         h1 { color: #333; }
#         button {
#             background-color: #007bff;
#             color: white;
#             padding: 12px 30px;
#             border: none;
#             border-radius: 8px;
#             font-size: 18px;
#             cursor: pointer;
#             transition: 0.3s;
#         }
#         button:hover {
#             background-color: #0056b3;
#         }
#         #status {
#             margin-top: 20px;
#             font-size: 16px;
#             color: #222;
#         }
#     </style>
# </head>
# <body>
#     <h1>☀️ Solar Panel Inspection</h1>
#     <button onclick="startInspection()">Fetch & Inspect</button>
#     <div id="status">Idle</div>

#     <script>
#         async function startInspection() {
#             document.getElementById("status").innerText = "🔍 Fetching and inspecting images...";
#             try {
#                 const res = await fetch("/start-inspection", { method: "POST" });
#                 const data = await res.json();
#                 document.getElementById("status").innerText =
#                     "✅ " + data.status + " (" + (data.count || 0) + " images processed)";
#             } catch (err) {
#                 document.getElementById("status").innerText = "❌ Error starting inspection.";
#                 console.error(err);
#             }
#         }
#     </script>
# </body>
# </html>
# """

# def send_detection_to_panel(detection_data, max_retries=3):
#     """Send detected data to Node backend (localhost:3000)."""
#     for attempt in range(max_retries):
#         try:
#             response = requests.post('http://localhost:3000/api/update-panel', 
#                                      json=detection_data,
#                                      timeout=10)
#             if response.status_code == 200:
#                 print(f"✅ Detection data sent successfully for {detection_data['panelId']}")
#                 return True
#             else:
#                 print(f"❌ Failed: {response.status_code} -> {response.text}")
#         except requests.exceptions.RequestException as e:
#             print(f"⚠️ Error sending data: {e}")
#         time.sleep(1)
#     return False

# def perform_inspection():
#     """Fetch images from Drive, detect faults and send results."""
#     print("🔍 Starting inspection process...")

#     results = service.files().list(
#         q=f"'{FOLDER_ID}' in parents and mimeType contains 'image/'",
#         fields="files(id, name)").execute()
#     items = results.get('files', [])
    
#     if not items:
#         print("❌ No images found.")
#         return {"status": "No images found"}

#     output = []
#     for item in items:
#         print(f"📷 Processing: {item['name']} ({item['id']})")

#         # Download image
#         request = service.files().get_media(fileId=item['id'])
#         fh = io.BytesIO()
#         downloader = MediaIoBaseDownload(fh, request)
#         done = False
#         while not done:
#             status, done = downloader.next_chunk()
#         fh.seek(0)
#         image_bytes = fh.read()

#         # Convert to OpenCV image
#         nparr = np.frombuffer(image_bytes, np.uint8)
#         img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#         # Detect panel number
#         panel_results = panel_number_model(img)
#         if len(panel_results[0].boxes) > 0:
#             panel_box = panel_results[0].boxes[0]
#             panel_class_id = int(panel_box.cls[0])
#             panel_label = panel_number_model.names[panel_class_id]
#             panel_id = f"Panel {panel_label}"
#         else:
#             panel_id = "Unknown"

#         # Detect faults
#         fault_results = fault_model(img)
#         if len(fault_results[0].boxes) > 0:
#             fault_box = fault_results[0].boxes[0]
#             fault_class_id = int(fault_box.cls[0])
#             fault_conf = float(fault_box.conf[0])
#             fault_label = fault_model.names[fault_class_id]
#             faults = f"{fault_label} ({fault_conf:.2f})"
#             level = "high"
#         else:
#             faults = "none"
#             level = "none"

#         # Encode image as base64
#         img_pil = Image.open(io.BytesIO(image_bytes))
#         buffered = io.BytesIO()
#         img_pil.save(buffered, format="JPEG")
#         img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
#         img_data_url = f"data:image/jpeg;base64,{img_b64}"

#         detection_data = {
#             "panelId": panel_id,
#             "faults": faults,
#             "level": level,
#             "image": img_data_url
#         }

#         output.append(detection_data)
#         send_detection_to_panel(detection_data)

#     with open(OUTPUT_JSON, 'w') as f:
#         json.dump(output, f, indent=2)

#     print("✅ Inspection complete. Results saved.")
#     return {"status": "Inspection complete", "count": len(output)}

# # === ROUTES ===
# @app.route('/')
# def home():
#     return render_template_string(HTML_PAGE)

# @app.route('/start-inspection', methods=['POST'])
# def start_inspection():
#     result = perform_inspection()
#     return jsonify(result)

# if __name__ == '__main__':
#     app.run(port=5001, debug=True)
