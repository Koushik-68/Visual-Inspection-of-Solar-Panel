import os
import subprocess
from datetime import datetime

def capture_camera_image():
    # Create output folder if not exists
    os.makedirs("captured_images", exist_ok=True)

    filename = f"captured_images/test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    
    try:
        # Capture using libcamera-still
        subprocess.run(["libcamera-still", "-o", filename, "-n"], check=True)
        print(f"✅ Image captured successfully: {filename}")
    except subprocess.CalledProcessError as e:
        print("❌ Error capturing image:", e)
    except FileNotFoundError:
        print("⚠️ libcamera-still not found. Install using: sudo apt install libcamera-apps")

if __name__ == "__main__":
    capture_camera_image()
