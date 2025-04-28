#!/usr/bin/env python3
"""
API Server Test Script

This script tests the API endpoints of the Raspberry Pi server to ensure they're working correctly.
Run this script after starting the API server to verify functionality.
"""

import requests
import json
import time
import sys

# API base URL - change this to your Raspberry Pi's IP if testing remotely
API_BASE_URL = "http://localhost:5000"

# Color codes for terminal output
COLORS = {
    "GREEN": "\033[92m",
    "YELLOW": "\033[93m",
    "RED": "\033[91m",
    "BLUE": "\033[94m",
    "ENDC": "\033[0m"
}

def print_colored(text, color):
    """Print colored text to the terminal"""
    print(f"{COLORS[color]}{text}{COLORS['ENDC']}")

def test_endpoint(endpoint, description):
    """Test an API endpoint and return the response"""
    url = f"{API_BASE_URL}{endpoint}"
    print_colored(f"\nTesting: {description}", "BLUE")
    print(f"Endpoint: {url}")
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            print_colored(f"Status: OK (200) - Response time: {elapsed_time:.2f}s", "GREEN")
            try:
                # Try to parse as JSON
                data = response.json()
                print("Response data:")
                print(json.dumps(data, indent=2))
                return data
            except json.JSONDecodeError:
                # Not JSON data (might be image stream)
                content_type = response.headers.get('Content-Type', '')
                print(f"Content-Type: {content_type}")
                if 'image' in content_type or 'multipart' in content_type:
                    print("[Image data or stream - content not displayed]")
                else:
                    print(f"Response (first 100 chars): {response.text[:100]}...")
                return response
        else:
            print_colored(f"Status: ERROR ({response.status_code})", "RED")
            print(f"Response: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print_colored("Connection Error: Could not connect to the API server", "RED")
        print("Make sure the API server is running and the URL is correct.")
        return None
    except requests.exceptions.Timeout:
        print_colored("Timeout Error: The API server took too long to respond", "RED")
        return None
    except Exception as e:
        print_colored(f"Error: {str(e)}", "RED")
        return None

def main():
    """Main function to run all tests"""
    print_colored("===== API SERVER TEST SCRIPT =====", "YELLOW")
    print(f"Testing API server at: {API_BASE_URL}")
    print("Press Ctrl+C to stop at any time\n")
    
    # Test camera snapshot endpoint
    test_endpoint("/api/camera-snapshot", "Camera Snapshot")
    
    # Test door status endpoint
    door_status = test_endpoint("/api/door-status", "Door Status")
    if door_status:
        print(f"Current door status: {door_status.get('status', 'unknown')}")
    
    # Test recognition status endpoint
    recognition = test_endpoint("/api/recognition-status", "Recognition Status")
    if recognition:
        print(f"Recognition status: {recognition.get('status', 'unknown')}")
        if recognition.get('recognizedFace'):
            print(f"Recognized face: {recognition.get('recognizedFace')}")
    
    # Test attendance records endpoint
    attendance = test_endpoint("/api/attendance", "Attendance Records")
    if attendance and isinstance(attendance, list):
        print(f"Retrieved {len(attendance)} attendance records")
    
    # Test statistics endpoint
    stats = test_endpoint("/api/stats", "System Statistics")
    if stats:
        print(f"Total students: {stats.get('totalStudents', 'unknown')}")
        print(f"Today's entries: {stats.get('todaysEntries', 'unknown')}")
    
    print_colored("\n===== TEST SUMMARY =====", "YELLOW")
    print("All tests completed. Check the results above for any errors.")
    print("If all endpoints returned status 200, the API server is working correctly.")
    print("Next steps:")
    print("1. Update the API_BASE_URL in src/config/api.ts with your Raspberry Pi's IP")
    print("2. Start the React frontend with 'npm run dev'")
    print("3. Verify that the frontend can connect to the API server")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\nTest script stopped by user", "YELLOW")
        sys.exit(0)