import os
import io
import json
import base64
import time
import requests
import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, render_template_string, redirect, url_for, flash
from flask_cors import CORS
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseDownload
from ultralytics import YOLO

# === CONFIGURATION ===
SERVICE_ACCOUNT_FILE = r'C:\Users\Admin\Downloads\plexiform-bot-446507-f4-a76a05de5300.json'
FOLDER_ID = '1m8LAKEib1smUjqeQ7XtcHFSnwtwVI6rV'
OUTPUT_JSON = 'panel_results.json'
UPLOAD_FOLDER = 'uploads'

# === INITIAL SETUP ===
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app = Flask(__name__)
app.secret_key = 'your_secret_key'
CORS(app)

# === GOOGLE DRIVE SETUP ===
SCOPES = ['https://www.googleapis.com/auth/drive']
creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
service = build('drive', 'v3', credentials=creds)

# === YOLO MODELS ===
fault_model = YOLO('model/best.pt')
panel_number_model = YOLO('model/num.pt')

# === HTML TEMPLATE ===
HTML_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Solar Panel Inspection Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white font-sans min-h-screen flex items-center justify-center">
    <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl">
        <h1 class="text-3xl font-bold text-center mb-6">☀️ Solar Panel Inspection Dashboard</h1>
        <p class="text-gray-400 text-center mb-8">Upload or Fetch solar panel images for inspection</p>

        <!-- Upload Form -->
        <form action="/upload-panel-image" method="post" enctype="multipart/form-data" class="mb-10 text-center">
            <label class="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg class="w-10 h-10 mb-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13 13h3a3 3 0 000-6h-.025A5.56 5.56 0 0016 6.5 5.5 5.5 0 005.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 000 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                    </svg>
                    <p class="text-gray-300"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                    <p class="text-xs text-gray-400">PNG, JPG or JPEG</p>
                </div>
                <input name="file" type="file" class="hidden" accept="image/*" required />
            </label>

            <button type="submit" class="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold shadow-md transition">
                Upload & Inspect
            </button>
        </form>

        <hr class="border-gray-600 mb-8">

        <!-- Fetch & Inspect Button -->
        <div class="text-center">
            <button id="fetchBtn" onclick="startInspection()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-md transition">
                Fetch & Inspect from Google Drive
            </button>
            <p id="status" class="mt-4 text-gray-300">Idle</p>
        </div>

        {% if messages %}
        <div class="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
            {{ messages }}
        </div>
        {% endif %}
    </div>

    <script>
        async function startInspection() {
            const status = document.getElementById("status");
            status.innerText = "🔍 Fetching and inspecting images...";
            try {
                const res = await fetch("/start-inspection", { method: "POST" });
                const data = await res.json();
                status.innerText = "✅ " + data.status + " (" + (data.count || 0) + " images processed)";
            } catch (err) {
                status.innerText = "❌ Error starting inspection.";
                console.error(err);
            }
        }
    </script>
</body>
</html>
"""

# === COMMON HELPERS ===
def send_detection_to_panel(detection_data, max_retries=3):
    """Send detected data directly to the main backend to update DB."""
    url = 'http://localhost:5000/api/panels/detection-update'
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=detection_data, timeout=10)
            if response.status_code == 200:
                print(f"✅ Sent data for {detection_data['panelId']}")
                return True
            else:
                print(f"❌ Failed ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"⚠️ Retry {attempt+1}: {e}")
        time.sleep(1)
    print("❌ Failed after retries.")
    return False

def get_fault_level(faults):
    desc = faults.lower().replace('-', ' ')
    if 'physical damage' in desc:
        return 'high'
    if 'dust' in desc or 'bird' in desc or 'drop' in desc or 'snow' in desc:
        return 'medium'
    if 'clean' in desc or 'no faults' in desc or 'healthy' in desc:
        return 'low'
    return 'low'


def detect_faults(img):
    # Panel number
    panel_results = panel_number_model(img)
    panel_id = "Unknown"
    if len(panel_results[0].boxes) > 0:
        cls_id = int(panel_results[0].boxes[0].cls[0])
        panel_id = f"Panel {panel_number_model.names[cls_id]}"

    # Fault detection
    fault_results = fault_model(img)
    faults = "no faults"
    
    if len(fault_results[0].boxes) > 0:
        cls_id = int(fault_results[0].boxes[0].cls[0])
        conf = float(fault_results[0].boxes[0].conf[0])
        faults = f"{fault_model.names[cls_id]} ({conf:.2f})"

    # ✅ USE SAME LOGIC HERE
    level = get_fault_level(faults)

    # Encode image
    _, buffer = cv2.imencode('.jpg', img)
    img_b64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "panelId": panel_id,
        "faults": faults,
        "level": level,
        "image": f"data:image/jpeg;base64,{img_b64}"
    }

# === ROUTES ===
@app.route('/')
def home():
    messages = request.args.get('messages', '')
    return render_template_string(HTML_PAGE, messages=messages)

@app.route('/upload-panel-image', methods=['POST'])
def upload_panel_image():
    if 'file' not in request.files:
        flash("No file uploaded")
        return redirect(url_for('home', messages="No file selected."))

    file = request.files['file']
    if file.filename == '':
        return redirect(url_for('home', messages="Empty file name."))

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    img = cv2.imread(file_path)
    detection_data = detect_faults(img)
    os.remove(file_path)

    with open(OUTPUT_JSON, 'w') as f:
        json.dump(detection_data, f, indent=2)

    send_detection_to_panel(detection_data)
    return redirect(url_for('home', messages=f"✅ Uploaded and inspected {detection_data['panelId']}"))

@app.route('/start-inspection', methods=['POST'])
def start_inspection():
    results = service.files().list(
        q=f"'{FOLDER_ID}' in parents and mimeType contains 'image/'",
        fields="files(id, name)").execute()
    items = results.get('files', [])

    if not items:
        return jsonify({"status": "No images found"})

    output = []
    for item in items:
        print(f"📷 Processing: {item['name']}")
        request_drive = service.files().get_media(fileId=item['id'])
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request_drive)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.seek(0)
        nparr = np.frombuffer(fh.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        detection_data = detect_faults(img)
        output.append(detection_data)
        send_detection_to_panel(detection_data)

    with open(OUTPUT_JSON, 'w') as f:
        json.dump(output, f, indent=2)

    return jsonify({"status": "Inspection complete", "count": len(output)})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
