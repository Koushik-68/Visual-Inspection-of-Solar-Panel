import socket
import pickle
import json
import requests
import os
import time

def save_detection_data(detection_data):
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    panel_id = detection_data.get('panelId', 'unknown_panel')
    filename = f"detection_{panel_id.replace(' ', '_')}_{timestamp}.json"
    filepath = os.path.join("detections", filename)
    
    if not os.path.exists("detections"):
        os.makedirs("detections")
        
    with open(filepath, "w") as f:
        json.dump(detection_data, f, indent=2)
    print(f"✅ Detection saved to {filepath}")

def send_to_website(detection_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(
                'http://localhost:3000/api/update-panel',
                json=detection_data,
                timeout=10
            )
            if response.status_code == 200:
                print(f"✅ Data sent to website for {detection_data['panelId']}")
                return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Attempt {attempt + 1}: {str(e)}")
            time.sleep(1)
    return False

def main():
    # Connect to Raspberry Pi
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    raspberry_pi_ip = input("Enter Raspberry Pi IP address: ")
    try:
        client_socket.connect((raspberry_pi_ip, 5000))
        print("Connected to Raspberry Pi camera server")
        
        print("\nControls:")
        print("- Press SPACE to capture")
        print("- Press 'q' to quit")
        
        while True:
            command = input()
            
            if command == " ":  # Space
                client_socket.send("CAPTURE".encode())
                data = pickle.loads(client_socket.recv(4194304))  # 4MB buffer
                
                if data:
                    save_detection_data(data)
                    send_to_website(data)
                else:
                    print("⚠️ No valid detection data received")
                    
            elif command.lower() == "q":
                client_socket.send("QUIT".encode())
                break
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client_socket.close()

if __name__ == "__main__":
    main()