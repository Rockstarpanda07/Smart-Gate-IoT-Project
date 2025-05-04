import { supabase } from '../integrations/supabase';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

// Function to sync data from local API to Supabase
export const syncDataToSupabase = async () => {
  try {
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('students').select('count');
      if (error) {
        console.error('Supabase connection test failed:', error);
        // Check if it's an authentication error
        if (error.message.includes('API key')) {
          console.error('API key issue detected. Check your Supabase URL and API key configuration.');
          console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
          console.log('API Key defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        }
      } else {
        console.log('Supabase connection successful, count:', data);
      }
    } catch (e) {
      console.error('Supabase connection test exception:', e);
    }
    
    // Sync students
    const studentsResponse = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS));
    console.log('Students API response status:', studentsResponse.status);
    const studentsData = await studentsResponse.json();
    console.log('Fetched students data:', studentsData);
    
    // Check if students is an array before iterating
    if (Array.isArray(studentsData)) {
      // Upsert students to Supabase
      for (const student of studentsData) {
        const { data, error } = await supabase
          .from('students')
          .upsert({
            // Don't try to set the UUID id field directly
            // id: student.rollno,  // Remove this line
            name: student.name,
            rollno: student.rollno,
            course: student.course
          }, { onConflict: 'rollno' }); // Use rollno as the conflict resolution field
          
        if (error) {
          console.error('Error upserting student record:', error);
          console.error('Problematic student:', student);
        }
      }
      // Add logging after upsert
      console.log('Synced students to Supabase');
    } else {
      console.error("Students data is not an array", studentsData);
    }
    
    // Sync attendance
    const attendanceResponse = await fetch(buildApiUrl(API_ENDPOINTS.ATTENDANCE));
    const attendanceData = await attendanceResponse.json();
    
    // Add logging
    console.log('Fetched attendance data:', attendanceData);
    
    // Check if attendance is an array before iterating
    if (Array.isArray(attendanceData)) {
      // Upsert attendance to Supabase
      for (const record of attendanceData) {
        const { data, error } = await supabase
          .from('student_attendance')
          .upsert({
            student_id: record.studentId,
            status: record.status,
            timestamp: `${record.date}T${record.timestamp}`,
            verification_method: record.verificationMethod || 'camera' // Add default value
          }, { onConflict: 'student_id,timestamp' }); // Use composite key for conflict resolution
        
        if (error) {
          console.error('Error upserting attendance record:', error);
          console.error('Problematic record:', record);
        }
      }
      // Add logging after upsert
      console.log('Synced attendance to Supabase');
    } else {
      console.error("Attendance data is not an array", attendanceData);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Data sync failed with detailed error:', error);
    // Log more details if error is an object
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { success: false, error };
  }
};

// Function to run periodic sync
export const startPeriodicSync = (intervalMinutes = 1) => {
  // Initial sync
  syncDataToSupabase();
  
  // Set up interval for periodic sync
  return setInterval(syncDataToSupabase, intervalMinutes * 60 * 1000);
};