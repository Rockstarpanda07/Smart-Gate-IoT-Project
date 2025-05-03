import { supabase } from '../integrations/supabase';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

// Function to sync data from local API to Supabase
export const syncDataToSupabase = async () => {
  try {
    // Sync students
    const studentsResponse = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS));
    const students = await studentsResponse.json();
    
    // Upsert students to Supabase
    for (const student of students) {
      await supabase
        .from('students')
        .upsert({
          id: student.id,
          name: student.name,
          rollno: student.rollno,
          course: student.course
        }, { onConflict: 'id' });
    }
    
    // Sync attendance
    const attendanceResponse = await fetch(buildApiUrl(API_ENDPOINTS.ATTENDANCE));
    const attendance = await attendanceResponse.json();
    
    // Upsert attendance to Supabase
    for (const record of attendance) {
      await supabase
        .from('student_attendance')
        .upsert({
          student_id: record.studentId,
          status: record.status,
          timestamp: `${record.date}T${record.timestamp}`
        }, { onConflict: 'student_id, timestamp' });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Data sync failed:', error);
    return { success: false, error };
  }
};

// Function to run periodic sync
export const startPeriodicSync = (intervalMinutes = 5) => {
  // Initial sync
  syncDataToSupabase();
  
  // Set up interval for periodic sync
  return setInterval(syncDataToSupabase, intervalMinutes * 60 * 1000);
};