# AttendSmart Gate System Development Starter Script
# This PowerShell script helps start both the API server and frontend for development

# Configuration
$API_SERVER_PATH = "api_server.py"
$API_TEST_PATH = "test_api.py"
$FRONTEND_START_CMD = "npm run dev"

# Function to display colored text
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Display welcome message
Write-ColorOutput Green "===== AttendSmart Gate System Development Starter ====="
Write-ColorOutput Cyan "This script helps you start the development environment for the AttendSmart Gate System."

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-ColorOutput Green "Python detected: $pythonVersion"
}
catch {
    Write-ColorOutput Red "Error: Python is not installed or not in PATH. Please install Python 3.x"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-ColorOutput Green "Node.js detected: $nodeVersion"
    Write-ColorOutput Green "npm detected: $npmVersion"
}
catch {
    Write-ColorOutput Red "Error: Node.js/npm is not installed or not in PATH. Please install Node.js"
    exit 1
}

# Menu options
Write-ColorOutput Yellow "\nPlease select an option:"
Write-ColorOutput White "1. Start API server only"
Write-ColorOutput White "2. Test API endpoints"
Write-ColorOutput White "3. Start frontend only"
Write-ColorOutput White "4. Start both API server and frontend (separate windows)"
Write-ColorOutput White "5. Exit"

$option = Read-Host "Enter your choice (1-5)"

switch ($option) {
    "1" {
        Write-ColorOutput Cyan "\nStarting API server..."
        Write-ColorOutput Cyan "Press Ctrl+C to stop the server\n"
        python $API_SERVER_PATH
    }
    "2" {
        Write-ColorOutput Cyan "\nTesting API endpoints..."
        python $API_TEST_PATH
    }
    "3" {
        Write-ColorOutput Cyan "\nStarting frontend development server..."
        Write-ColorOutput Cyan "Press Ctrl+C to stop the server\n"
        Invoke-Expression $FRONTEND_START_CMD
    }
    "4" {
        Write-ColorOutput Cyan "\nStarting both API server and frontend in separate windows..."
        
        # Start API server in a new window
        Start-Process powershell -ArgumentList "-Command", "Write-Host 'Starting API Server...' -ForegroundColor Cyan; python '$API_SERVER_PATH'; Read-Host 'Press Enter to close this window'"
        
        # Wait a moment for the API server to start
        Start-Sleep -Seconds 2
        
        # Start frontend in this window
        Write-ColorOutput Cyan "Starting frontend development server..."
        Write-ColorOutput Cyan "Press Ctrl+C to stop the server\n"
        Invoke-Expression $FRONTEND_START_CMD
    }
    "5" {
        Write-ColorOutput Yellow "Exiting..."
        exit 0
    }
    default {
        Write-ColorOutput Red "Invalid option. Please run the script again and select a valid option."
        exit 1
    }
}