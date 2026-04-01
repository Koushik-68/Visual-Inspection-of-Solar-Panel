import socket
import os
import base64
import pickle
import struct

def capture_image():
    """Use pre-existing image (no camera)."""
    filename = "capture.jpg"
    if not os.path.exists(filename):
        print("❌ capture.jpg not found in the current folder!")
        return b""
    print("📸 Using existing capture.jpg for test")
    with open(filename, "rb") as f:
        return f.read()

def send_with_size(sock, data_bytes):
    """Send 4-byte length header followed by data."""
    data_len = len(data_bytes)
    sock.sendall(struct.pack("!I", data_len))  # send length (4 bytes)
    sock.sendall(data_bytes)

def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(("0.0.0.0", 5000))
    server_socket.listen(1)
    print("📷 Waiting for laptop connection...")

    client_socket, addr = server_socket.accept()
    print(f"✅ Connected to laptop at {addr}")

    while True:
        command = client_socket.recv(1024).decode().strip()
        if command == "CAPTURE":
            print("📸 Capture command received.")
            img_bytes = capture_image()
            if not img_bytes:
                error_msg = pickle.dumps("ERROR: No image found")
                send_with_size(client_socket, error_msg)
                continue

            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            payload = pickle.dumps(img_b64)
            send_with_size(client_socket, payload)
            print(f"✅ Image ({len(payload)} bytes) sent successfully.")

        elif command == "QUIT":
            print("👋 Quitting server...")
            break

    client_socket.close()
    server_socket.close()

if __name__ == "__main__":
    start_server()
