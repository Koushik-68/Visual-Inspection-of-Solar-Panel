import socket
import pickle
import base64
import time
import os
import struct

def recv_all(sock, n):
    """Receive exactly n bytes."""
    data = b""
    while len(data) < n:
        packet = sock.recv(n - len(data))
        if not packet:
            return None
        data += packet
    return data

def recv_with_size(sock):
    """Receive 4-byte size header, then data."""
    raw_len = recv_all(sock, 4)
    if not raw_len:
        return None
    msg_len = struct.unpack("!I", raw_len)[0]
    return recv_all(sock, msg_len)

def main():
    raspberry_ip = input("Enter Raspberry Pi IP address: ").strip()
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        client_socket.connect((raspberry_ip, 5000))
        print("✅ Connected to Raspberry Pi")
    except socket.error as e:
        print(f"❌ Connection Error: {e}")
        return

    if not os.path.exists("received_images"):
        os.makedirs("received_images")

    print("\nControls:")
    print("- Type 'capture' and press ENTER to receive image")
    print("- Type 'q' and press ENTER to quit")

    while True:
        command_input = input("Command ('capture' or 'q'): ").strip().lower()
        if command_input == "":
            continue

        elif command_input == "capture":
            client_socket.send("CAPTURE".encode())
            print("➡️ Sent CAPTURE command to Raspberry Pi")

            data = recv_with_size(client_socket)
            if not data:
                print("❌ No data received (connection lost?)")
                break

            payload = pickle.loads(data)

            if isinstance(payload, str) and payload.startswith("ERROR:"):
                print(payload)
            else:
                img_bytes = base64.b64decode(payload)
                filename = f"received_images/capture_{time.strftime('%Y%m%d_%H%M%S')}.jpg"
                with open(filename, "wb") as f:
                    f.write(img_bytes)
                print(f"✅ Image saved: {filename}")

        elif command_input == "q":
            client_socket.send("QUIT".encode())
            print("👋 Closing connection.")
            break

        else:
            print("Invalid command. Please enter 'capture' or 'q'.")

    client_socket.close()

if __name__ == "__main__":
    main()
