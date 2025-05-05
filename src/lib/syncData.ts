import { supabase } from '../integrations/supabase';
import { API_ENDPOINTS, buildApiUrl, API_BASE_URL } from "@/config/api";

// Interface for sync result
export interface SyncResult {
  success: boolean;
  data?: any;
  error?: any;
  timestamp?: Date;
}

/**
 * Function to sync data from local API to Supabase
 * Fetches students and attendance data from local API and sends to Supabase via separate API endpoints
 */
export const syncDataToSupabase = async (): Promise<SyncResult> => {
  try {
    // Step 1: Test Supabase connection
    console.log('Testing Supabase connection...');
    try {
      const { data: testData, error } = await supabase.from('students').select('count');
      if (error) {
        console.error('Supabase connection test failed:', error);
        return { 
          success: false, 
          error: {
            message: `Supabase connection failed: ${error.message}`,
            details: error,
            type: 'supabase_connection'
          },
          timestamp: new Date() 
        };
      }
      console.log('Supabase connection successful');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Supabase connection test exception:', e);
      return { 
        success: false, 
        error: {
          message: `Supabase connection exception: ${errorMessage}`,
          details: e,
          type: 'supabase_exception'
        },
        timestamp: new Date() 
      };
    }
    
    // Step 2: Sync students data
    console.log('Syncing students data...');
    try {
      // Change this to use the regular students endpoint
      const studentsResponse = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS), {
        method: 'GET',  // Changed from POST to GET
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),  // 10-second timeout
      });
      
      if (!studentsResponse.ok) {
        let errorData;
        try {
          errorData = await studentsResponse.json();
        } catch (e) {
          errorData = { message: `HTTP Error: ${studentsResponse.status} ${studentsResponse.statusText}` };
        }
        console.error('Students sync API error:', errorData);
        return { 
          success: false, 
          error: {
            message: `Students sync failed with status ${studentsResponse.status}: ${errorData.message || 'Unknown error'}`,
            details: errorData,
            type: 'api_students_sync',
            status: studentsResponse.status
          },
          timestamp: new Date() 
        };
      }
      
      const students = await studentsResponse.json();
      console.log('Students data fetched successfully:', students);
      
      // Sync students to Supabase directly
      const { error: studentsError } = await supabase.from('students').upsert(
        students.map((student: any) => ({
          name: student.name,
          rollno: student.studentId || student.rollno,
          course: student.course || 'N/A',
          dob: student.dob || '2000-01-01', // Add default date if dob is null/undefined
          email: student.email || `${student.rollno}@example.com` // Add default email if missing
        })),
        { onConflict: 'rollno' }
      );
  
      if (studentsError) {
        console.error('Supabase students sync error:', studentsError);
        return { 
          success: false, 
          error: {
            message: `Supabase students sync failed: ${studentsError.message}`,
            details: studentsError,
            type: 'supabase_students_sync'
          },
          timestamp: new Date() 
        };
      }
      
      console.log('Students sync completed successfully');
      
      // Step 3: Sync attendance data
      console.log('Syncing attendance data...');
      const attendanceResponse = await fetch(buildApiUrl(API_ENDPOINTS.ATTENDANCE), {
        method: 'GET',  // Changed from POST to GET
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),  // 10-second timeout
      });
      
      if (!attendanceResponse.ok) {
        let errorData;
        try {
          errorData = await attendanceResponse.json();
        } catch (e) {
          errorData = { message: `HTTP Error: ${attendanceResponse.status} ${attendanceResponse.statusText}` };
        }
        console.error('Attendance sync API error:', errorData);
        return { 
          success: false, 
          error: {
            message: `Attendance sync failed with status ${attendanceResponse.status}: ${errorData.message || 'Unknown error'}`,
            details: errorData,
            type: 'api_attendance_sync',
            status: attendanceResponse.status
          },
          timestamp: new Date() 
        };
      }
      
      const attendance = await attendanceResponse.json();
      console.log('Attendance data fetched successfully:', attendance);
      
      // Sync attendance to Supabase directly
      const { error: attendanceError } = await supabase.from('student_attendance').upsert(
        attendance.map((record: any) => ({
          student_id: record.studentId,
          date: record.date,
          timestamp: `${record.date}T${record.timestamp}`,
          status: record.status.toLowerCase(), // This already handles 'proxy' correctly
          verification_method: record.status.toLowerCase() === 'proxy' ? 'partially verified' : (record.verificationMethod || 'none')
        })),
        { onConflict: 'student_id,timestamp' }
      );
  
      if (attendanceError) {
        console.error('Supabase attendance sync error:', attendanceError);
        return { 
          success: false, 
          error: {
            message: `Supabase attendance sync failed: ${attendanceError.message}`,
            details: attendanceError,
            type: 'supabase_attendance_sync'
          },
          timestamp: new Date() 
        };
      }
      
      console.log('Attendance sync completed successfully');
      
      return {
        success: true,
        data: {
          studentsCount: students.length,
          attendanceCount: attendance.length
        },
        timestamp: new Date()
      };
    } catch (error) {
      // Enhanced error handling for network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof TypeError && errorMessage.includes('Failed to fetch') ? 'network_error' : 'unknown_error';
      
      // Provide more helpful debugging information
      let detailedMessage = errorMessage;
      if (errorType === 'network_error') {
        detailedMessage = `Network error: Could not connect to API server at ${API_BASE_URL}. ` +
                         `This may be due to CORS issues, server being down, or network connectivity problems. ` +
                         `Original error: ${errorMessage}`;
      }
      
      console.error('Data sync failed:', {
        message: detailedMessage,
        type: errorType,
        originalError: error
      });
      
      return { 
        success: false, 
        error: {
          message: detailedMessage,
          details: error,
          type: errorType
        },
        timestamp: new Date() 
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Data sync failed (outer try/catch):', error);
    return { 
      success: false, 
      error: {
        message: `Unexpected error during sync: ${errorMessage}`,
        details: error,
        type: 'unexpected_error'
      },
      timestamp: new Date() 
    };
  }
};

/**
 * Function to start periodic sync at specified interval
 * @param intervalMinutes - Interval in minutes between syncs (default: 5)
 * @returns Interval ID that can be used to clear the interval
 */
export const startPeriodicSync = (intervalMinutes = 5) => {
  console.log(`Setting up automatic sync every ${intervalMinutes} minutes`);
  
  // Initial sync
  syncDataToSupabase().then(result => {
    if (result.success) {
      console.log('Initial sync completed successfully');
    } else {
      console.error('Initial sync failed:', result.error);
    }
  });
  
  // Set up interval for periodic sync
  return setInterval(() => {
    console.log(`Running scheduled sync (${new Date().toLocaleTimeString()})`);
    syncDataToSupabase().then(result => {
      if (!result.success) {
        console.error('Scheduled sync failed:', result.error);
      }
    });
  }, intervalMinutes * 60 * 1000);
};