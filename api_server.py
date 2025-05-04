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
from api_error_handler import api_error_handler, retry_operation, check_db_connection, error_response

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
# Replace the simple CORS(app) with a more specific configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://192.168.187.111:8080",  # Phone frontend
            "http://192.168.187.111:8081",  # Phone frontend (alternate port)
            "http://10.31.3.211:8080",      # College backend
            "http://10.31.4.69:8080",       # College frontend
            "http://localhost:8080",         # Local development
            "http://localhost:8081"          # Local development (alternate port)
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})  # Enable CORS for all routes

# GPIO Setup with error handling
try:
    # Keep gpiod for infrared and buzzer
    chip = gpiod.Chip('gpiochip0')
    infrared_pin = chip.get_line(17)
    buzzer_pin = chip.get_line(27)
    
    infrared_pin.request(consumer="attendance_system", type=gpiod.LINE_REQ_DIR_IN)
    buzzer_pin.request(consumer="attendance_system", type=gpiod.LINE_REQ_DIR_OUT)
    
    # Setup RPi.GPIO for servo motor
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
        # Use a much more conservative configuration with very low resolution
        camera_config = picam2.create_still_configuration(
            main={"size": (640, 480)},  # Much lower resolution
            lores={"size": (320, 240)},  # Even lower for secondary stream
            display=None,  # Disable display stream
            buffer_count=1  # Minimize buffer usage
        )
        picam2.configure(camera_config)
        picam2.start()
        logging.info("Camera initialized successfully")
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
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
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
        
        # Updated to include verification_method
        cursor.execute("INSERT INTO student_attendance (student_id, status, verification_method) VALUES (%s, %s, %s)", 
                      (student_id, "present", "fully verified"))
        db.commit()
        
        cursor.close()
        db.close()  # Return to pool
        
        last_activity = time.strftime("%H:%M:%S")
        print(f"Attendance logged for student: {student_id}")
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
    print("Waiting for student to enter...")
    start_time = time.time()
    
    while time.time() - start_time < 15:
        if infrared_pin.get_value() == 1:
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
    global barcode_data, face_detected, door_status
    
    while True:
        try:
            if picam2 and door_status == "closed":
                frame = picam2.capture_array()
                detected_barcode = scan_barcode(frame)
                
                if detected_barcode:
                    logging.info(f"QR code detected: {detected_barcode}")
                    if check_student_in_db(detected_barcode):
                        if verify_face(frame):
                            log_attendance(detected_barcode)
                            open_door()
                            if not check_entry():
                                print("Please try again.")
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
            # Reset status if there was an error
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
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE DATE(timestamp) = CURDATE()")
        todays_entries = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM student_attendance WHERE YEARWEEK(timestamp) = YEARWEEK(NOW())")
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
                   DATE_FORMAT(sa.timestamp, '%H:%i:%s') as time, sa.status
            FROM student_attendance sa
            JOIN students s ON sa.student_id = s.rollno
            ORDER BY sa.timestamp DESC
            LIMIT 20
        """)
        
        result = [{
            'name': row[0],  # Changed from 'studentName' to 'name' for consistency
            'studentId': row[1],
            'date': row[2],
            'timestamp': row[3],
            'status': row[4].lower(),
            'verificationMethod': 'face'
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
        
        # First, get current student data if name or rollno is being updated
        # (needed to generate new email if these fields change)
        regenerate_email = 'name' in data or 'rollno' in data
        
        if regenerate_email:
            cursor.execute("SELECT name, rollno FROM students WHERE id = %s", (student_id,))
            current_data = cursor.fetchone()
            
            if not current_data:
                cursor.close()
                db.close()
                return error_response("Student not found", 404)
                
            # Use updated values or current values as needed
            name = data.get('name', current_data[0])
            rollno = data.get('rollno', current_data[1])
            
            # Generate new email
            name_part = name.lower().replace(' ', '')[:5]  # First 5 letters of name
            email = f"{name_part}{rollno}@snuchennai.edu.in"
            
            # Add email to the fields to update
            update_fields = ["email = %s"]
            params = [email]
        else:
            update_fields = []
            params = []
        
        # Add other fields to update
        if 'name' in data:
            update_fields.append("name = %s")
            params.append(data['name'])
        
        if 'rollno' in data:
            update_fields.append("rollno = %s")
            params.append(data['rollno'])
        
        if 'course' in data:
            update_fields.append("course = %s")
            params.append(data['course'])
            
        if 'dob' in data:
            update_fields.append("dob = %s")
            params.append(data['dob'])
        
        params.append(student_id)  # For the WHERE clause
        
        query = f"UPDATE students SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, params)
        
        if cursor.rowcount == 0:
            cursor.close()
            db.close()  # Return to pool
            return error_response("Student not found", 404)
        
        db.commit()
        cursor.close()
        db.close()  # Return to pool
        
        response_data = {'message': 'Student updated successfully'}
        if regenerate_email:
            response_data['email'] = email
            
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
        
        # Log the student_id for debugging
        logging.info(f"Attempting to delete student with ID: {student_id}")
        
        # Use the string ID directly without conversion
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            db.close()  # Return to pool
            return error_response("Student not found", 404)
        
        db.commit()
        cursor.close()
        db.close()  # Return to pool
        
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

# Start the periodic check thread
db_check_thread = threading.Thread(target=periodic_db_check)
db_check_thread.daemon = True
db_check_thread.start()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
        'database': check_db_connection(connection_pool),
        'camera': picam2 is not None
    })

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, use_reloader=False)
    except Exception as e:
        logging.error(f"Error starting server: {e}")
        cleanup()
