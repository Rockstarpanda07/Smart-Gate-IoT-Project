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

## Raspberry Pi Integration

### 1. Database Setup

Create a MySQL database named `attendance` with the following tables:

```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rollno VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  course VARCHAR(50)
);

CREATE TABLE student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'Present'
);
```

### 2. Raspberry Pi Setup

1. Install required Python packages:

```bash
pip install flask flask-cors opencv-python numpy mysql-connector-python pyzbar picamera2 gpiozero
```

2. Connect the hardware components:

   - Pi Camera to the camera port
   - Infrared sensor to GPIO 17
   - Buzzer to GPIO 27
   - Servo motor to GPIO 22

3. Run the API server:

```bash
python api_server.py
```

The server will start on port 5000.

### 3. API Configuration

Update the API base URL in the following files with your Raspberry Pi's IP address:

- `src/components/CameraFeed.tsx`
- `src/components/DoorStatus.tsx`
- `src/components/AttendanceTable.tsx`
- `src/pages/Index.tsx`

Change `http://your-raspberry-pi-ip:5000` to your actual Raspberry Pi's IP address (e.g., `http://192.168.1.100:5000`).

## API Endpoints

### Camera Feed

- `GET /api/camera-feed`: Streams live camera feed as multipart/x-mixed-replace
- `GET /api/camera-snapshot`: Returns the current camera frame as a base64-encoded image
- `GET /api/recognition-status`: Returns the current recognition status (recognized face, last activity, processing status)

### Door Control

- `GET /api/door-status`: Returns the current door status (open, closed, opening, closing, alert)

### Statistics

- `GET /api/stats`: Returns system statistics (total students, today's entries, weekly entries)
- `GET /api/attendance`: Returns recent attendance records

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
