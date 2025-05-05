# AttendSmart Gate System

A smart attendance system that uses Raspberry Pi, camera, and sensors to automate student attendance tracking with barcode scanning and face verification.

## Project info

**URL**: https://lovable.dev/projects/4b610508-d83e-4722-a391-7c4d36729784

## System Architecture

### Hardware Components

- Raspberry Pi 5
- Pi Camera
- Infrared sensor (GPIO 17)
- Buzzer (GPIO 27)
- Servo motor for door control (GPIO 22)

### Software Components

- **Raspberry Pi**: Python Flask API server
- **Frontend**: React web application with real-time monitoring
- **Database**: MySQL for storing student data and attendance records
- **Cloud Storage**: Supabase for remote data synchronization

## Raspberry Pi Integration

### 1. Database Setup

Create a MySQL database named `attendance` with the following tables:

```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rollno VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  course VARCHAR(50),
  dob DATE,
  email VARCHAR(100)
);

CREATE TABLE student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'present',
  verification_method VARCHAR(50) DEFAULT 'fully verified',
  UNIQUE KEY unique_daily_attendance (student_id, date)
);
```

The `UNIQUE KEY` constraint prevents duplicate attendance entries for the same student on the same day.

### 2. Raspberry Pi Setup

1. Install required Python packages:

```bash
pip install flask flask-cors opencv-python numpy mysql-connector-python pyzbar picamera2 gpiod RPi.GPIO requests
```

2. Connect the hardware components:

   - Pi Camera to the camera port
   - Infrared sensor to GPIO 17
   - Buzzer to GPIO 27
   - Servo motor to GPIO 22 (PWM controlled)

3. Run the API server:

```bash
python api_server.py
```

The server will start on port 5000.

### 3. API Configuration

The API server is configured with specific CORS settings to allow connections from approved origins:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://192.168.187.111:8080",  # Phone frontend
            "http://192.168.187.111:8081",  # Phone frontend (alternate port)
            "http://10.31.3.211:8080",      # College backend
            "http://10.31.4.69:8080",       # College frontend
            "http://localhost:8080",         # Local development
            "http://localhost:8081",         # Local development (alternate port)
            "http://192.168.56.1:8080",      # Additional frontend
            "http://192.168.187.113:5000"    # API server itself
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True
    }
})
```

Update the frontend configuration in `src/config/api.ts` with your Raspberry Pi's IP address.

## Database Connection Pooling

The system uses MySQL connection pooling for improved performance and reliability:

```python
connection_pool = MySQLConnectionPool(pool_name="attendance_pool",
                                    pool_size=5,
                                    **dbconfig)
```

## Cloud Synchronization with Supabase

Attendance records are automatically synchronized to Supabase for cloud backup and remote access:

```python
def sync_to_supabase(table, data, on_conflict=None):
    # Synchronizes local data to Supabase cloud database
    # Uses conflict resolution to handle duplicate entries
```

## API Endpoints

### Camera Feed

- `GET /api/camera-feed`: Streams live camera feed as multipart/x-mixed-replace
- `GET /api/camera-snapshot`: Returns the current camera frame as a base64-encoded image
- `GET /api/recognition-status`: Returns the current recognition status (recognized face, last activity, processing status)

### Door Control

- `GET /api/door-status`: Returns the current door status (open, closed, opening, closing, alert)

### Statistics and Data

- `GET /api/stats`: Returns system statistics (total students, today's entries, weekly entries)
- `GET /api/attendance`: Returns recent attendance records
- `GET /api/students`: Returns the list of all registered students

## Duplicate Attendance Prevention

The system prevents duplicate attendance entries through two mechanisms:

1. **Database Constraint**: The `UNIQUE KEY` constraint in the `student_attendance` table prevents multiple entries for the same student on the same day.

2. **Application Logic**: Before logging attendance, the system checks if an entry already exists:

```python
# Check if student already has an attendance record for today
current_date = time.strftime("%Y-%m-%d")
cursor.execute("SELECT id FROM student_attendance WHERE student_id = %s AND DATE(date) = %s",
              (student_id, current_date))
existing_record = cursor.fetchone()

if existing_record:
    # Student already has an attendance record for today
    print(f"Student {student_id} already has attendance for today. Skipping.")
    return
```

## Error Handling and Resilience

The system includes robust error handling with:

- API error handling decorator for consistent error responses
- Retry mechanism for transient hardware failures
- Database connection checking and pooling
- Graceful degradation when hardware components fail

## Testing the System

### API Endpoints Testing

You can test the API endpoints using tools like Postman or curl:

```bash
# Test camera snapshot endpoint
curl http://localhost:5000/api/camera-snapshot

# Test door status endpoint
curl http://localhost:5000/api/door-status

# Test recognition status endpoint
curl http://localhost:5000/api/recognition-status

# Test attendance records endpoint
curl http://localhost:5000/api/attendance

# Test statistics endpoint
curl http://localhost:5000/api/stats

# Test students list endpoint
curl http://localhost:5000/api/students
```

### Hardware Testing

1. **Camera Test**: Verify that the camera can detect faces and scan barcodes
2. **Door Control Test**: Verify that the servo motor can open and close the door
3. **Sensor Test**: Verify that the infrared sensor can detect when someone passes through
4. **Buzzer Test**: Verify that the buzzer activates when an unauthorized access is attempted

### Frontend Integration Testing

1. Start the API server on the Raspberry Pi: `python api_server.py`
2. Start the React frontend: `npm run dev`
3. Open the frontend in a browser and verify that:
   - The camera feed is displayed
   - Door status is updated in real-time
   - Attendance records are displayed and updated
   - Statistics are displayed correctly

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4b610508-d83e-4722-a391-7c4d36729784) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4b610508-d83e-4722-a391-7c4d36729784) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
