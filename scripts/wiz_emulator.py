"""
WiZ Bulb Emulator for WiZAPP Testing
=====================================
Simulates multiple WiZ bulbs with unique IPs and MACs.

Usage:
  python wiz_emulator.py

Then add bulbs manually in the app using IPs:
  - 127.0.0.1 (Living Room)
  - 127.0.0.2 (Bedroom)
  - 127.0.0.3 (Kitchen)

Requirements:
  Python 3.6+ (no external dependencies)
"""

import socket
import json
import threading
import time

# Configuration - add more bulbs by extending this list
VIRTUAL_BULBS = [
    {"ip": "127.0.0.1", "mac": "AA:BB:CC:DD:EE:01", "name": "Living Room", "state": True, "dimming": 80, "sceneId": 11},
    {"ip": "127.0.0.2", "mac": "AA:BB:CC:DD:EE:02", "name": "Bedroom", "state": False, "dimming": 50, "sceneId": 12},
    {"ip": "127.0.0.3", "mac": "AA:BB:CC:DD:EE:03", "name": "Kitchen", "state": True, "dimming": 100, "sceneId": 13},
]

WIZ_PORT = 38899


class VirtualBulb:
    def __init__(self, config):
        self.ip = config["ip"]
        self.mac = config["mac"]
        self.name = config["name"]
        self.state = config["state"]
        self.dimming = config["dimming"]
        self.sceneId = config["sceneId"]
        self.running = True
        self.sock = None
    
    def get_pilot_response(self):
        """Response format that wiz-local-control expects"""
        return {
            "method": "getPilot",
            "env": "pro",
            "result": {
                "mac": self.mac.replace(":", "").lower(),
                "rssi": -50,
                "src": "",
                "state": self.state,
                "sceneId": self.sceneId,
                "dimming": self.dimming,
                "temp": 2700,
                "r": 255,
                "g": 255,
                "b": 255,
            }
        }
    
    def get_system_config_response(self):
        """Response for getSystemConfig that the app uses"""
        return {
            "method": "getSystemConfig",
            "env": "pro",
            "result": {
                "mac": self.mac.replace(":", "").lower(),
                "moduleName": self.name,
                "homeId": 12345,
                "roomId": 1,
                "rgn": "us",
                "fwVersion": "1.0.0",
                "groupId": 0,
                "rssi": -50,
                "ping": 10
            }
        }
    
    def get_registration_response(self):
        """Response for discovery/registration that wiz-local-control expects"""
        return {
            "method": "registration",
            "env": "pro",
            "result": {
                "mac": self.mac.replace(":", "").lower(),
                "success": True
            }
        }
    
    def handle_set_pilot(self, params):
        if "state" in params:
            self.state = params["state"]
        if "dimming" in params:
            self.dimming = params["dimming"]
        if "sceneId" in params:
            self.sceneId = params["sceneId"]
        
        return {
            "method": "setPilot",
            "env": "pro",
            "result": {"success": True}
        }
    
    def handle_message(self, data):
        try:
            msg = json.loads(data.decode())
            method = msg.get("method", "")
            
            if method == "getPilot":
                return self.get_pilot_response(), method
            elif method == "getSystemConfig":
                return self.get_system_config_response(), method
            elif method == "setPilot":
                return self.handle_set_pilot(msg.get("params", {})), method
            elif method == "registration":
                # Discovery registration request - respond with registration success
                return self.get_registration_response(), method
            else:
                print(f"  [{self.name}] Unknown method: {method}")
                return {"error": "Unknown method"}, method
        except json.JSONDecodeError:
            return {"error": "Invalid JSON"}, "invalid_json"
    
    def run(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.sock.bind((self.ip, WIZ_PORT))
            self.sock.settimeout(1.0)
            
            print(f"  ✓ {self.name} listening on {self.ip}:{WIZ_PORT} (MAC: {self.mac})")
            
            while self.running:
                try:
                    data, addr = self.sock.recvfrom(1024)
                    response, method = self.handle_message(data)
                    
                    # Log the interaction
                    print(f"  [{self.name}] {method} from {addr[0]} -> {response.get('method', 'response')}")
                    
                    self.sock.sendto(json.dumps(response).encode(), addr)
                except socket.timeout:
                    continue
                except Exception as e:
                    if self.running:
                        print(f"  [{self.name}] Error: {e}")
        except OSError as e:
            if "10048" in str(e) or "address already in use" in str(e).lower():
                print(f"  ✗ {self.name} - Port {WIZ_PORT} already in use on {self.ip}")
                print(f"    Make sure the app or another emulator isn't using this address")
            else:
                print(f"  ✗ {self.name} - Error: {e}")
        finally:
            if self.sock:
                self.sock.close()
    
    def stop(self):
        self.running = False


def main():
    print("\n" + "="*50)
    print("  WiZ Bulb Emulator for WiZAPP")
    print("="*50)
    print(f"\nStarting {len(VIRTUAL_BULBS)} virtual bulbs...\n")
    
    bulbs = []
    threads = []
    
    for config in VIRTUAL_BULBS:
        bulb = VirtualBulb(config)
        bulbs.append(bulb)
        thread = threading.Thread(target=bulb.run, daemon=True)
        threads.append(thread)
        thread.start()
    
    # Give bulbs time to start
    time.sleep(0.5)
    
    print("\n" + "-"*50)
    print("Emulator running. Add these IPs manually in WiZAPP:")
    for config in VIRTUAL_BULBS:
        state = "ON" if config["state"] else "OFF"
        print(f"  • {config['ip']} → {config['name']} ({state})")
    print("-"*50)
    print("\nPress Ctrl+C to stop the emulator\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping emulator...")
        for bulb in bulbs:
            bulb.stop()
        print("Done!")


if __name__ == "__main__":
    main()
