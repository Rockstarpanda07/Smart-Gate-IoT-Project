import cv2
import numpy as np
import time
import mysql.connector
from pyzbar.pyzbar import decode
from picamera2 import Picamera2
import gpiod
import RPi.GPIO as GPIO  # Add RPi.GPIO import
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import threading
import json
import base64
import logging
import atexit
from api_error_handler import api_error_handler, check_db_connection, error_response

# Initialize logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_server.log"),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)

# Update the CORS configuration to be more permissive for development
# Update the CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://192.168.165.222:8080", "http://localhost:8080"],  # Updated IP
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "max_age": 86400
    }
})  # Enable CORS for all routes

@app.after_request
def add_cors_headers(response):
    # Only add headers if they're not already present
    if 'Access-Control-Allow-Origin' not in response.headers:
        # You can use '*' or specify origins
        response.headers.add('Access-Control-Allow-Origin', '*')
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# GPIO Setup with error handling
try:
    # Keep gpiod for infrared and buzzer
    chip = gpiod.Chip('gpiochip0')
    infrared_pin = chip.get_line(17)
    buzzer_pin = chip.get_line(27)
    
    infrared_pin.request(consumer="attendance_system", type=gpiod.LINE_REQ_DIR_IN)
    buzzer_pin.request(consumer="attendance_system", type=gpiod.LINE_REQ_DIR_OUT)
    
    # Setup RPi.GPIO for servo motor
    # Add this near the top of your file with other constants
    DOOR_OPEN_TIME = 10  # Time in seconds to keep the door open
    servo_pin = 22
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(servo_pin, GPIO.OUT)
    motor_pwm = GPIO.PWM(servo_pin, 50)  # 50Hz for servos
    motor_pwm.start(0)
    
    logging.info("GPIO pins initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize GPIO: {e}")
    exit(1)

# Database setup
# Add this import at the top
from mysql.connector.pooling import MySQLConnectionPool

# Replace the current database setup with this
try:
    # Create a connection pool
    dbconfig = {
        "host": "localhost",
        "user": "root",
        "password": "test",
        "database": "attendance"
    }
    connection_pool = MySQLConnectionPool(pool_name="attendance_pool",
                                        pool_size=5,
                                        **dbconfig)
    logging.info("Database connection pool established successfully")
    
    # Get a connection to verify it works
    db = connection_pool.get_connection()
    cursor = db.cursor()
    cursor.execute("SELECT 1")
    cursor.fetchone()
    cursor.close()
    db.close()  # Return connection to pool
    
except mysql.connector.Error as err:
    logging.error(f"Database connection error: {err}")
    connection_pool = None


# Initialize Pi Camera
# Add these imports at the top of your file
import os
import requests

# Replace these lines:
# Load environment variables

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://dvkpjqjuimtpwuzlpfhr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

# With these hardcoded values:
# Supabase configuration - hardcoded credentials
SUPABASE_URL = 'https://dvkpjqjuimtpwuzlpfhr.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2a3BqcWp1aW10cHd1emxwZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MTAyNjEsImV4cCI6MjA2MTM4NjI2MX0.K_AeFYVisbPjdw0By6vqu1h5JfYqiMRvDpNadF3DwC4'

# Function to sync data to Supabase
def sync_to_supabase(table, data, on_conflict=None):
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
        
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        
        # Add conflict resolution if specified
        if on_conflict:
            url += f"?on_conflict={on_conflict}"
            
        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=10  # Add timeout parameter
        )
        
        if response.status_code in [200, 201, 204]:
            logging.info(f"Data synced to Supabase {table} table successfully")
            return True
        else:
            logging.error(f"Failed to sync data to Supabase {table} table: {response.text}")
            return False
    except Exception as e:
        logging.error(f"Error syncing to Supabase {table} table: {e}")
        return False

# Set environment variables to disable hardware acceleration before initializing camera
os.environ["LIBCAMERA_LOG_LEVELS"] = "*=3"
os.environ["PICAMERA2_DISABLE_HARDWARE_ACCELERATION"] = "1"

# Initialize Pi Camera with more conservative settings and better error handling
try:
    # First check if camera is available
    from picamera2.picamera2 import Picamera2
    camera_info = Picamera2.global_camera_info()
    
    if len(camera_info) > 0:
        picam2 = Picamera2()
        # Configure for RGB format explicitly
        camera_config = picam2.create_still_configuration(
            main={"size": (1280, 720), "format": "RGB888"},  # Specify RGB format
            lores={"size": (640, 480)},
            display=None,
            buffer_count=2
        )
        
        picam2.configure(camera_config)  # Apply the configuration
        picam2.set_controls({"AwbEnable": True, "AwbMode": 0})  # Auto white balance
        picam2.start()
        logging.info("Camera initialized successfully with improved settings")
    else:
        logging.error("No camera detected on this device")
        picam2 = None
except Exception as e:
    logging.error(f"Failed to initialize camera: {e}")
    picam2 = None

# Global variables to store state
door_status = "closed"  # closed, opening, open, closing, alert
last_opened = None
recognized_face = None
last_activity = None
barcode_data = None
face_detected = False

# Function to scan barcode
# Function to scan barcode
def scan_barcode(frame):
    global barcode_data
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        barcodes = decode(gray)
        
        for barcode in barcodes:
            barcode_data = barcode.data.decode("utf-8")
            print(f"Barcode Detected: {barcode_data}")
            return barcode_data
        return None
    except Exception as e:
        logging.error(f"Error scanning barcode: {e}")
        return None

# Function to verify face
def verify_face(frame):
    global face_detected
    try:
        # Try multiple possible paths for the cascade file
        cascade_paths = [
            '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml',  # Common location
            '/usr/local/share/opencv4/haarcascades/haarcascade_frontalface_default.xml',  # Alternative location
            '/usr/local/lib/python3.9/dist-packages/cv2/data/haarcascade_frontalface_default.xml'  # Pip installation location
        ]
        
        face_cascade = None
        for cascade_path in cascade_paths:
            if os.path.exists(cascade_path):
                face_cascade = cv2.CascadeClassifier(cascade_path)
                if not face_cascade.empty():
                    break
        
        if face_cascade is None or face_cascade.empty():
            logging.error("Error: Could not load face cascade classifier from any known location")
            return False
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) > 0:
            face_detected = True
            print("Face detected!")
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            return True
        face_detected = False
        return False
    except Exception as e:
        logging.error(f"Error in face detection: {e}")
        return False

# Function to log attendance
# Function to log attendance
def log_attendance(student_id):
    global recognized_face, last_activity
    
    try:
        # Get a fresh connection
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        cursor.execute("SELECT name FROM students WHERE rollno = %s", (student_id,))
        result = cursor.fetchone()
        if result:
            recognized_face = result[0]
        else:
            recognized_face = f"Unknown ({student_id})"
        
        # Check if student already has an attendance record for today
        current_date = time.strftime("%Y-%m-%d")
        cursor.execute("SELECT id FROM student_attendance WHERE student_id = %s AND DATE(date) = %s", 
                      (student_id, current_date))
        existing_record = cursor.fetchone()
        
        if existing_record:
            # Student already has an attendance record for today
            print(f"Student {student_id} already has attendance for today. Skipping.")
            last_activity = time.strftime("%H:%M:%S")
            cursor.close()
            db.close()  # Return to pool
            return
        
        # Updated to include verification_method
        cursor.execute("INSERT INTO student_attendance (student_id, status, verification_method) VALUES (%s, %s, %s)", 
                      (student_id, "present", "fully verified"))
        db.commit()
        
        cursor.close()
        db.close()  # Return to pool
        
        last_activity = time.strftime("%H:%M:%S")
        print(f"Attendance logged for student: {student_id}")
        
        # Sync to Supabase
        current_time = time.strftime("%H:%M:%S")
        
        # Prepare data for Supabase
        attendance_data = {
            "student_id": student_id,
            "status": "present",
            "verification_method": "fully verified",
            "date": current_date,
            "timestamp": f"{current_date}T{current_time}"
        }
        
        # Sync to Supabase in a separate thread to avoid blocking
        threading.Thread(
            target=sync_to_supabase,
            args=("student_attendance", attendance_data, "student_id,timestamp")
        ).start()
        
    except mysql.connector.Error as err:
        logging.error(f"Error logging attendance: {err}")

# Updated door opening/closing with RPi.GPIO servo control
def open_door():
    global door_status, last_opened
    print("Opening door...")
    door_status = "opening"
    
    # Move servo to open position (90 degrees)
    duty = 90 / 18 + 2  # Convert angle to duty cycle
    motor_pwm.ChangeDutyCycle(duty)
    time.sleep(0.5)
    motor_pwm.ChangeDutyCycle(0)  # Stop the servo from jittering
    
    door_status = "open"
    last_opened = time.strftime("%H:%M:%S")
    
    # Remove the DOOR_OPEN_TIME definition from here
    
    def auto_close():
        global door_status
        time.sleep(DOOR_OPEN_TIME)  # Use the constant
        door_status = "closing"
        
        # Move servo to closed position (0 degrees)
        duty = 0 / 18 + 2  # Convert angle to duty cycle
        motor_pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        motor_pwm.ChangeDutyCycle(0)  # Stop the servo from jittering
        
        door_status = "closed"
    
    threading.Thread(target=auto_close).start()

# Function to check student entry
def check_entry():
    global door_status  # Add this line to access the global variable
    print("Waiting for student to enter...")
    start_time = time.time()
    
    while time.time() - start_time < 15:
        if infrared_pin.get_value() == 0:
            print("Student entered successfully.")
            return True
    
    print("Student did not enter. Activating buzzer.")
    door_status = "alert"
    buzzer_pin.set_value(1)
    time.sleep(3)
    buzzer_pin.set_value(0)
    door_status = "closed"
    return False

# Function to check if student exists in the database
def check_student_in_db(student_id):
    try:
        db = connection_pool.get_connection()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM students WHERE rollno = %s", (student_id,))
        result = cursor.fetchone() is not None
        cursor.close()
        db.close()  # Return to pool
        return result
    except mysql.connector.Error as err:
        logging.error(f"Error checking student in DB: {err}")
        return False

# Background processing thread
def background_processing():
    global barcode_data, face_detected, door_status, last_activity
    while True:
        try:
            if picam2 and door_status == "closed":
                frame = picam2.capture_array()
                detected_barcode = scan_barcode(frame)
                if detected_barcode:
                    logging.info(f"QR code detected: {detected_barcode}")
                    if check_student_in_db(detected_barcode):
                        if verify_face(frame):
                            open_door()
                            # Wait for student to enter
                            if check_entry():
                                log_attendance(detected_barcode)  # Mark as present only if entered
                                print("Student entered successfully. Marked as present.")
                            else:
                                update_attendance_to_proxy(detected_barcode)  # Mark as proxy if not entered
                                print("Student didn't enter. Marked as proxy.")
                            
                            # Add this line to update the attendance data in the frontend
                            # This will make the attendance table refresh immediately
                            last_activity = time.strftime("%H:%M:%S")
                        else:
                            print("Face verification failed!")
                    else:
                        print("Student not found. Access denied.")
                        door_status = "alert"
                        buzzer_pin.set_value(1)
                        time.sleep(1)
                        buzzer_pin.set_value(0)
                        time.sleep(0.5)
                        door_status = "closed"
        except Exception as e:
            logging.error(f"Error in background processing: {e}")
            if door_status == "alert":
                buzzer_pin.set_value(0)
                door_status = "closed"
        time.sleep(0.1)

# Cleanup function
def cleanup():
    try:
        if buzzer_pin:
            buzzer_pin.release()
        if infrared_pin:
            infrared_pin.release()
        if picam2:
            picam2.stop()
            picam2.close()
        
        # Cleanup RPi.GPIO
        if 'motor_pwm' in globals():
            motor_pwm.stop()
        GPIO.cleanup()
        
        logging.info("Cleanup completed successfully")
    except Exception as e:
        logging.error(f"Cleanup error: {e}")

atexit.register(cleanup)

# Start background processing
processing_thread = threading.Thread(target=background_processing)
processing_thread.daemon = True
processing_thread.start()

# API Routes remain exactly the same as before
@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': 'Smart Gate API Server is running'
    })
@app.route('/api/camera-feed', methods=['GET'])
def get_camera_feed():
    if not picam2:
        return error_response("Camera not available", 503)
    
    def generate_frames():
        while True:
            frame = picam2.capture_array()
            scan_barcode(frame)
            verify_face(frame)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.1)
    
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/camera-snapshot', methods=['GET'])
@api_error_handler
def get_camera_snapshot():
    if not picam2:
        return error_response("Camera not available", 503)
        
    frame = picam2.capture_array()
    scan_barcode(frame)
    verify_face(frame)
    ret, buffer = cv2.imencode('.jpg', frame)
    return jsonify({
        'image': f'data:image/jpeg;base64,{base64.b64encode(buffer).decode("utf-8")}',
        'timestamp': time.strftime("%H:%M:%S")
    })

@app.route('/api/door-status', methods=['GET'])
@api_error_handler
def get_door_status():
    return jsonify({
        'status': door_status,
        'lastOpened': last_opened,
        'autoCloseTimer': DOOR_OPEN_TIME if door_status == "open" else 0
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
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    try:
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM students")
        total_students = cursor.fetchone()[0]
        
        # More explicit date formatting for today's entries
        today = time.strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE DATE(timestamp) = %s", (today,))
        todays_entries = cursor.fetchone()[0]
        
        # Calculate the start and end of the current week (Sunday to Saturday)
        # Get current date
        now = time.localtime()
        # Calculate days since start of week (assuming week starts on Sunday, 0-indexed)
        days_since_sunday = now.tm_wday + 1 if now.tm_wday < 6 else 0
        # Calculate start of week timestamp
        week_start = time.strftime("%Y-%m-%d", time.localtime(time.time() - days_since_sunday * 86400))
        # Calculate end of week timestamp (6 days after start)
        week_end = time.strftime("%Y-%m-%d", time.localtime(time.time() + (6 - days_since_sunday) * 86400))
        
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE DATE(timestamp) BETWEEN %s AND %s", 
                      (week_start, week_end))
        this_week = cursor.fetchone()[0]
        
        cursor.close()
        db.close()  # Return to pool
        
        return jsonify({
            'totalStudents': total_students,
            'todaysEntries': todays_entries,
            'thisWeek': this_week
        })
    except mysql.connector.Error as err:
        return error_response(f"Database error: {err}", 500)

@app.route('/api/attendance', methods=['GET'])
@api_error_handler
def get_attendance():
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    try:
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT s.name, sa.student_id, DATE_FORMAT(sa.timestamp, '%Y-%m-%d') as date, 
                   DATE_FORMAT(sa.timestamp, '%H:%i:%s') as time, sa.status, sa.verification_method
            FROM student_attendance sa
            JOIN students s ON sa.student_id = s.rollno
            ORDER BY sa.timestamp DESC
            LIMIT 20
        """)
        
        result = [{
            'name': row[0],
            'studentId': row[1],
            'date': row[2],
            'timestamp': row[3],
            'status': row[4].lower(),
            'verificationMethod': row[5] if row[5] else 'none'
        } for row in cursor.fetchall()]
        
        cursor.close()
        db.close()  # Return to pool
        
        return jsonify(result)
    except mysql.connector.Error as err:
        return error_response(f"Database error: {err}", 500)

# Add these endpoints before the if __name__ == '__main__': line

@app.route('/api/students', methods=['GET'])
@api_error_handler
def get_students():
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    try:
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        cursor.execute("SELECT id, name, rollno, course, email FROM students ORDER BY name")
        students = [{
            'id': row[0],
            'name': row[1],
            'rollno': row[2],
            'course': row[3],
            'email': row[4]
        } for row in cursor.fetchall()]
        
        cursor.close()
        db.close()  # Return to pool
        
        return jsonify(students)
    except mysql.connector.Error as err:
        return error_response(f"Database error: {err}", 500)

@app.route('/api/students', methods=['POST'])
@api_error_handler
def add_student():
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    data = request.json
    if not data or not all(key in data for key in ['name', 'rollno', 'course', 'dob']):
        return error_response("Missing required fields", 400)
    
    try:
        # Generate email based on the specified format
        name_part = data['name'].lower().replace(' ', '')[:5]  # First 5 letters of name
        email = f"{name_part}{data['rollno']}@snuchennai.edu.in"
        
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        cursor.execute(
            "INSERT INTO students (name, rollno, course, dob, email) VALUES (%s, %s, %s, %s, %s)",
            (data['name'], data['rollno'], data['course'], data['dob'], email)
        )
        db.commit()
        
        last_id = cursor.lastrowid
        cursor.close()
        db.close()  # Return to pool
        
        # Add email to the data for Supabase sync
        data['email'] = email
        
        # Sync to Supabase in a separate thread
        threading.Thread(
            target=sync_student_to_supabase,
            args=(data,)
        ).start()
        
        return jsonify({'message': 'Student added successfully', 'id': last_id, 'email': email}), 201
    except mysql.connector.Error as err:
        return error_response(f"Database error: {err}", 500)

@app.route('/api/students/<string:student_id>', methods=['PUT'])
@api_error_handler
def update_student(student_id):
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    data = request.json
    if not data or not any(key in data for key in ['name', 'rollno', 'course', 'dob']):
        return error_response("No fields to update", 400)
    
    try:
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        # First, get current student data
        cursor.execute("SELECT name, rollno, course, dob, email FROM students WHERE id = %s", (student_id,))
        current_data = cursor.fetchone()
        
        if not current_data:
            cursor.close()
            db.close()
            return error_response("Student not found", 404)
        
        # Create a dictionary of current data
        current_student = {
            'name': current_data[0],
            'rollno': current_data[1],
            'course': current_data[2],
            'dob': current_data[3],
            'email': current_data[4]
        }
        
        # Update with new data
        updated_student = {**current_student, **data}
        
        # Check if name or rollno is being updated (for email generation)
        regenerate_email = 'name' in data or 'rollno' in data
        
        if regenerate_email:
            # Generate new email
            name_part = updated_student['name'].lower().replace(' ', '')[:5]  # First 5 letters of name
            updated_student['email'] = f"{name_part}{updated_student['rollno']}@snuchennai.edu.in"
        
        # Build the SQL update query
        update_fields = []
        params = []
        
        for field in ['name', 'rollno', 'course', 'dob']:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if regenerate_email:
            update_fields.append("email = %s")
            params.append(updated_student['email'])
        
        params.append(student_id)  # For the WHERE clause
        
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        if cursor.rowcount == 0:
            cursor.close()
            db.close()  # Return to pool
            return error_response("Student not found or no changes made", 404)
        
        db.commit()
        cursor.close()
        db.close()  # Return to pool
        
        # Sync to Supabase
        threading.Thread(
            target=sync_student_to_supabase,
            args=(updated_student,)
        ).start()
        
        response_data = {'message': 'Student updated successfully'}
        if regenerate_email:
            response_data['email'] = updated_student['email']
            
        return jsonify(response_data)
    except mysql.connector.Error as err:
        return error_response(f"Database error: {err}", 500)

@app.route('/api/students/<string:student_id>', methods=['DELETE'])
@api_error_handler
def delete_student(student_id):
    if not check_db_connection(connection_pool):
        logging.info("Attempting to reconnect to database...")
        if not reconnect_database():
            return error_response("Database connection error", 503)
    
    try:
        # Get a fresh connection for each request
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        # First get the student's rollno (needed for Supabase deletion)
        cursor.execute("SELECT rollno FROM students WHERE id = %s", (student_id,))
        result = cursor.fetchone()
        
        if not result:
            cursor.close()
            db.close()  # Return to pool
            return error_response("Student not found", 404)
            
        rollno = result[0]  # Get the rollno for Supabase deletion
        
        # Delete from local database
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            db.close()  # Return to pool
            return error_response("Student not found", 404)
        
        db.commit()
        cursor.close()
        db.close()  # Return to pool
        
        # Delete from Supabase in a separate thread
        threading.Thread(
            target=delete_student_from_supabase,
            args=(rollno,)
        ).start()
        
        return jsonify({'message': 'Student deleted successfully'})
    except mysql.connector.Error as err:
        logging.error(f"Error deleting student: {err}")
        return error_response(f"Database error: {err}", 500)

# Add this function to your api_server.py file, after the database setup section

def reconnect_database():
    global connection_pool
    try:
        logging.info("Attempting to reconnect to database...")
        # Create a new connection pool
        dbconfig = {
            "host": "localhost",
            "user": "root",
            "password": "test",
            "database": "attendance"
        }
        connection_pool = MySQLConnectionPool(pool_name="attendance_pool",
                                          pool_size=5,
                                          **dbconfig)
        
        # Test the connection by getting a connection from the pool
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()  # Return connection to pool
        
        logging.info("Database reconnection successful")
        return True
    except mysql.connector.Error as err:
        logging.error(f"Database reconnection failed: {err}")
        connection_pool = None
        return False

# Add this function after the reconnect_database function
def periodic_db_check():
    """Periodically check database connection and attempt to reconnect if needed."""
    logging.info("Starting periodic database connection check")
    while True:
        time.sleep(60)  # Check every 60 seconds
        if not check_db_connection(connection_pool):
            logging.warning("Database connection lost, attempting to reconnect...")
            if reconnect_database():
                logging.info("Database reconnection successful in periodic check")
            else:
                logging.error("Database reconnection failed in periodic check")

# Add this near the end of your file, before the if __name__ == '__main__': line
# Start periodic database check
db_check_thread = threading.Thread(target=periodic_db_check)
db_check_thread.daemon = True
db_check_thread.start()
# Add this function to your api_server.py file, after the database setup section

@app.route('/api/health', methods=['GET'])
@api_error_handler
def health_check():
    return jsonify({
        'status': 'online',
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
        'services': {
            'database': check_db_connection(connection_pool),
            'supabase': check_supabase_connection(),
            'camera': picam2 is not None,
            'gpio': infrared_pin is not None and buzzer_pin is not None
        }
    })


# Function to sync student data to Supabase
def sync_student_to_supabase(student_data):
    try:
        # Prepare data for Supabase
        supabase_student = {
            "name": student_data['name'],
            "rollno": student_data['rollno'],
            "course": student_data['course'],
            "dob": student_data['dob'],
            "email": student_data['email']
        }
        
        # Sync to Supabase
        return sync_to_supabase("students", supabase_student, "rollno")
    except Exception as e:
        logging.error(f"Error syncing student to Supabase: {e}")
        return False

def update_attendance_to_proxy(student_id):
    try:
        db = connection_pool.get_connection()
        cursor = db.cursor()
        
        current_date = time.strftime("%Y-%m-%d")
        # Get the ID of the most recent attendance record first 
        cursor.execute( 
            "SELECT id FROM student_attendance WHERE student_id = %s AND DATE(date) = %s ORDER BY timestamp DESC LIMIT 1", 
            (student_id, current_date) 
        ) 
        record = cursor.fetchone() 
        if record: 
            cursor.execute("UPDATE student_attendance SET status = 'proxy', verification_method = 'partially verified' WHERE id = %s", (record[0],))
            print(f"Existing attendance record updated to proxy for student: {student_id}")
        else:
            # No attendance record found for today, create a new one
            print(f"Creating new proxy attendance record for student {student_id}")
            cursor.execute("INSERT INTO student_attendance (student_id, status, verification_method) VALUES (%s, %s, %s)", 
                          (student_id, "proxy", "partially verified"))
            
        db.commit()
        
        cursor.close()
        db.close()  # Return to pool
        
        # Sync to Supabase
        current_time = time.strftime("%H:%M:%S")
        
        # Prepare data for Supabase
        attendance_data = {
            "student_id": student_id,
            "status": "proxy",
            "verification_method": "partially verified",
            "date": current_date,
            "timestamp": f"{current_date}T{current_time}"
        }
        
        # Sync to Supabase in a separate thread to avoid blocking
        threading.Thread(
            target=sync_to_supabase,
            args=("student_attendance", attendance_data, "student_id,timestamp")
        ).start()
        
    except mysql.connector.Error as err:
        print(f"Database error in update_attendance_to_proxy: {err}")

def delete_student_from_supabase(student_id):
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        url = f"{SUPABASE_URL}/rest/v1/students?rollno=eq.{student_id}"
        
        response = requests.delete(
            url,
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 201, 204]:
            logging.info(f"Student {student_id} deleted from Supabase successfully")
            return True
        else:
            logging.error(f"Failed to delete student from Supabase: {response.text}")
            return False
    except Exception as e:
        logging.error(f"Error deleting student from Supabase: {e}")
        return False

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, use_reloader=False)
    except Exception as e:
        logging.error(f"Error starting server: {e}")
        cleanup()




