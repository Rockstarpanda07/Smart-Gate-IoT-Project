import cv2
import numpy as np
import time
import mysql.connector
from pyzbar.pyzbar import decode
from picamera2 import Picamera2
from gpiozero import Button, Buzzer, Servo
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import threading
import json
import base64
import logging
from api_error_handler import api_error_handler, retry_operation, check_db_connection, error_response

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# GPIO Setup using gpiozero
infrared_pin = Button(17)  # Infrared sensor
buzzer_pin = Buzzer(27)    # Buzzer
motor_pin = Servo(22)      # Motor for door

# Database setup
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="test",  # Replace with your MySQL password
        database="attendance"
    )
    cursor = db.cursor()
    logging.info("Database connection established successfully")
except mysql.connector.Error as err:
    logging.error(f"Database connection error: {err}")
    # The server will still start, but database operations will be handled with error checking

# Initialize Pi Camera
picam2 = Picamera2()
picam2.configure(picam2.create_still_configuration())
picam2.start()

# Global variables to store state
door_status = "closed"  # closed, opening, open, closing, alert
last_opened = None
recognized_face = None
last_activity = None
barcode_data = None
face_detected = False

# Function to scan barcode
def scan_barcode(frame):
    global barcode_data
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    barcodes = decode(gray)
    
    for barcode in barcodes:
        barcode_data = barcode.data.decode("utf-8")
        print(f"Barcode Detected: {barcode_data}")
        return barcode_data
    return None

# Function to verify face
def verify_face(frame):
    global face_detected
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(faces) > 0:
        face_detected = True
        print("Face detected!")
        # Draw rectangle around the face
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        return True
    face_detected = False
    return False

# Function to log attendance
def log_attendance(student_id):
    global recognized_face, last_activity
    
    # Get student name from database
    cursor.execute("SELECT name FROM students WHERE rollno = %s", (student_id,))
    result = cursor.fetchone()
    if result:
        student_name = result[0]
        recognized_face = student_name
    else:
        recognized_face = f"Unknown ({student_id})"
    
    # Log attendance
    cursor.execute("INSERT INTO student_attendance (student_id, status) VALUES (%s, %s)", (student_id, "Present"))
    db.commit()
    last_activity = time.strftime("%H:%M:%S")
    print(f"Attendance logged for student: {student_id}")

# Function to open door
def open_door():
    global door_status, last_opened
    print("Opening door...")
    door_status = "opening"
    motor_pin.max()  # Open door
    time.sleep(3)    # Door opening animation time
    door_status = "open"
    last_opened = time.strftime("%H:%M:%S")
    
    # Auto close after 5 seconds
    def auto_close():
        global door_status
        time.sleep(5)    # Keep door open for 5 seconds
        door_status = "closing"
        motor_pin.min()  # Close door
        time.sleep(3)    # Door closing animation time
        door_status = "closed"
    
    threading.Thread(target=auto_close).start()

# Function to check student entry
def check_entry():
    print("Waiting for student to enter...")
    start_time = time.time()
    
    while time.time() - start_time < 15:
        if infrared_pin.is_pressed:
            print("Student entered successfully.")
            return True
    
    print("Student did not enter. Activating buzzer.")
    door_status = "alert"
    buzzer_pin.on()  # Activate buzzer
    time.sleep(3)    # Wait for 3 seconds
    buzzer_pin.off()  # Deactivate buzzer
    door_status = "closed"
    return False

# Function to check if student exists in the database
def check_student_in_db(student_id):
    cursor.execute("SELECT * FROM students WHERE rollno = %s", (student_id,))
    result = cursor.fetchone()
    if result:
        return True
    return False

# Background processing thread
def background_processing():
    global barcode_data, face_detected, door_status
    
    while True:
        frame = picam2.capture_array()
        
        # Only scan for barcodes if the door is closed
        if door_status == "closed":
            # Scan for barcode
            detected_barcode = scan_barcode(frame)
            
            if detected_barcode and check_student_in_db(detected_barcode):
                # If barcode is valid, check for face
                if verify_face(frame):
                    # If face is verified, log attendance and open door
                    log_attendance(detected_barcode)
                    open_door()
                    # Check if student entered
                    if not check_entry():
                        print("Please try again.")
                else:
                    print("Face verification failed!")
            elif detected_barcode:
                print("Student not found in the database. Access denied.")
                door_status = "alert"
                buzzer_pin.on()
                time.sleep(1)
                buzzer_pin.off()
                time.sleep(0.5)
                door_status = "closed"
        
        # Sleep to prevent high CPU usage
        time.sleep(0.1)

# Start background processing in a separate thread
processing_thread = threading.Thread(target=background_processing)
processing_thread.daemon = True
processing_thread.start()

# API Routes
@app.route('/api/camera-feed', methods=['GET'])
def get_camera_feed():
    def generate_frames():
        while True:
            frame = picam2.capture_array()
            
            # Process the frame (scan barcode and verify face)
            scan_barcode(frame)
            verify_face(frame)
            
            # Convert frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            # Yield the frame in the response
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Sleep to control frame rate
            time.sleep(0.1)
    
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/camera-snapshot', methods=['GET'])
@api_error_handler
def get_camera_snapshot():
    frame = picam2.capture_array()
    
    # Process the frame (scan barcode and verify face)
    scan_barcode(frame)
    verify_face(frame)
    
    # Convert frame to JPEG and then to base64
    ret, buffer = cv2.imencode('.jpg', frame)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        'image': f'data:image/jpeg;base64,{frame_base64}',
        'timestamp': time.strftime("%H:%M:%S")
    })

@app.route('/api/door-status', methods=['GET'])
@api_error_handler
def get_door_status():
    return jsonify({
        'status': door_status,
        'lastOpened': last_opened,
        'autoCloseTimer': 5 if door_status == "open" else 0
    })

@app.route('/api/recognition-status', methods=['GET'])
@api_error_handler
def get_recognition_status():
    return jsonify({
        'recognizedFace': recognized_face,
        'lastActivity': last_activity,
        'status': 'processing' if face_detected or barcode_data else 'online'
    })

@app.route('/api/stats', methods=['GET'])
@api_error_handler
def get_stats():
    # Check database connection before executing queries
    if not check_db_connection(db):
        return error_response("Database connection error", 503)
    
    try:
        # Get total students count
        cursor.execute("SELECT COUNT(*) FROM students")
        total_students = cursor.fetchone()[0]
        
        # Get today's entries
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE DATE(timestamp) = CURDATE()")
        todays_entries = cursor.fetchone()[0]
        
        # Get this week's entries
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE YEARWEEK(timestamp) = YEARWEEK(NOW())")
        this_week = cursor.fetchone()[0]
        
        return jsonify({
            'totalStudents': total_students,
            'todaysEntries': todays_entries,
            'thisWeek': this_week
        })
    except mysql.connector.Error as err:
        logging.error(f"Database error in get_stats: {err}")
        return error_response(f"Database error: {err}", 500)

@app.route('/api/attendance', methods=['GET'])
@api_error_handler
def get_attendance():
    # Check database connection before executing queries
    if not check_db_connection(db):
        return error_response("Database connection error", 503)
    
    try:
        cursor.execute("""
            SELECT s.name, sa.student_id, DATE_FORMAT(sa.timestamp, '%Y-%m-%d') as date, 
                   DATE_FORMAT(sa.timestamp, '%H:%i:%s') as time, sa.status
            FROM student_attendance sa
            JOIN students s ON sa.student_id = s.rollno
            ORDER BY sa.timestamp DESC
            LIMIT 20
        """)
        
        attendance_records = []
        for row in cursor.fetchall():
            attendance_records.append({
                'studentName': row[0],
                'studentId': row[1],
                'date': row[2],
                'timestamp': row[3],
                'status': row[4].lower(),
                'verificationMethod': 'face'  # Default to face, can be updated based on actual method
            })
        
        return jsonify(attendance_records)
    except mysql.connector.Error as err:
        logging.error(f"Database error in get_attendance: {err}")
        return error_response(f"Database error: {err}", 500)

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("api_server.log"),
            logging.StreamHandler()
        ]
    )
    logging.info("Starting API server...")
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    except Exception as e:
        logging.error(f"Error starting server: {e}")