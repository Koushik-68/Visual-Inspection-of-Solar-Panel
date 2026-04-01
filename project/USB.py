import socket
import subprocess
import base64
import pickle
import cv2
import os

# --- MODIFIED: Use OpenCV's VideoCapture instead of subprocess call ---
def capture_image():
    """Capture image using OpenCV and return bytes."""
    # Use index 0 for the first detected camera (usually the USB webcam)
    cap = cv2.VideoCapture(0) 

    if not cap.isOpened():
        # Cleanly release the capture device if it failed to open
        cap.release()
        # Return an error message the client can handle
        return "ERROR: Camera not accessible. Check connection/drivers."

    # Set properties (optional, but good practice for speed)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    # Allow camera to warm up (critical for USB cameras)
    for _ in range(5):
        cap.read()
        
    ret, frame = cap.read()
    cap.release()

    if ret:
        # Save the frame to a temporary file (capture.jpg)
        filename = "capture.jpg"
        cv2.imwrite(filename, frame)
        
        # Read the file bytes back and delete the temp file
        with open(filename, "rb") as f:
            img_bytes = f.read()
        os.remove(filename)
        return img_bytes
    else:
        return "ERROR: Camera opened but failed to capture frame (ret=False)."

def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(("0.0.0.0", 5000))
    server_socket.listen(1)
    print("📷 Waiting for laptop connection...")
    
    # We use a loop here to handle disconnections and keep the server running
    while True:
        try:
            client_socket, addr = server_socket.accept()
            print(f"✅ Connected to laptop at {addr}")

            while True:
                # Set timeout for receiving commands
                client_socket.settimeout(60) 
                command = client_socket.recv(1024).decode()
                
                if not command: # Client disconnected
                    break 

                if command == "CAPTURE":
                    print("📸 Capturing image...")
                    img_data = capture_image()
                    
                    if isinstance(img_data, str) and img_data.startswith("ERROR:"):
                        # Send the error string back for client debugging
                        client_socket.send(pickle.dumps(img_data))
                        print(f"❌ Capture failed: {img_data}")
                    else:
                        img_b64 = base64.b64encode(img_data).decode('utf-8')
                        client_socket.send(pickle.dumps(img_b64))
                        print("✅ Image sent successfully.")

                elif command == "QUIT":
                    print("👋 Quitting server...")
                    return # Exit start_server loop
            
        except socket.timeout:
            print("❌ Client connection timed out. Restarting listen.")
        except ConnectionResetError:
            print("❌ Client disconnected unexpectedly. Restarting listen.")
        except Exception as e:
            print(f"Server error occurred: {e}. Restarting listen.")
        finally:
            if 'client_socket' in locals() and client_socket._closed == False:
                 client_socket.close()

    server_socket.close()

if __name__ == "__main__":
    start_server()
