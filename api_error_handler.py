#!/usr/bin/env python3
"""
API Error Handler Module

This module provides error handling utilities for the API server to improve robustness
when dealing with hardware or database connection issues.
"""

import time
import functools
import logging
from flask import jsonify

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_server.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("api_server")

# Error response generator
def error_response(message, status_code=500):
    """Generate a standardized error response"""
    return jsonify({
        "error": True,
        "message": message,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }), status_code

# Decorator for API route error handling
def api_error_handler(func):
    """Decorator to handle exceptions in API routes"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Log the error
            logger.error(f"Error in {func.__name__}: {str(e)}")
            
            # Determine the appropriate error message and status code
            if "mysql" in str(e).lower() or "database" in str(e).lower():
                return error_response("Database connection error. Please check the database server.", 503)
            elif "camera" in str(e).lower() or "picamera" in str(e).lower():
                return error_response("Camera error. Please check the camera connection.", 503)
            elif "gpio" in str(e).lower() or "pin" in str(e).lower():
                return error_response("Hardware error. Please check the GPIO connections.", 503)
            else:
                return error_response(f"Internal server error: {str(e)}", 500)
    return wrapper

# Retry mechanism for hardware operations
def retry_operation(max_attempts=3, delay=1):
    """Decorator to retry hardware operations that might fail temporarily"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            last_error = None
            
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    last_error = e
                    logger.warning(f"Operation {func.__name__} failed (attempt {attempts}/{max_attempts}): {str(e)}")
                    
                    if attempts < max_attempts:
                        time.sleep(delay)
                        delay *= 2  # Exponential backoff
            
            # If we get here, all attempts failed
            logger.error(f"Operation {func.__name__} failed after {max_attempts} attempts: {str(last_error)}")
            raise last_error
        return wrapper
    return decorator

# Database connection checker
def check_db_connection(connection_pool):
    """Check if the database connection pool is working"""
    if connection_pool is None:
        return False
        
    try:
        # Get a connection from the pool
        connection = connection_pool.get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        connection.close()  # Return to pool
        return True
    except Exception as e:
        logging.error(f"Database connection check failed: {e}")
        return False