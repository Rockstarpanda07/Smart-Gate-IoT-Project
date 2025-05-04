import { createClient } from '@supabase/supabase-js'

// Define proper types to help TypeScript understand the data structure
interface StudentRecord {
  name: string;
}

interface AttendanceRecord {
  id: number;
  student_id: string;
  status: string;
  timestamp: string;
  students: StudentRecord | StudentRecord[] | null;
}

// Use the provided credentials
export const supabase = createClient(
  'https://dvkpjqjuimtpwuzlpfhr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2a3BqcWp1aW10cHd1emxwZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MTAyNjEsImV4cCI6MjA2MTM4NjI2MX0.K_AeFYVisbPjdw0By6vqu1h5JfYqiMRvDpNadF3DwC4'
)

// Helper functions for data operations
export const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const fetchAttendance = async () => {
  // Modified query to fix the 400 error
  const { data, error } = await supabase
    .from('student_attendance')
    .select('id, student_id, status, timestamp')
    .order('timestamp', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  // Get student names in a separate query if needed
  const { data: studentsData } = await supabase
    .from('students')
    .select('id, name, rollno')
  
  const studentMap = {};
  if (studentsData) {
    studentsData.forEach(student => {
      studentMap[student.id] = student.name;
      studentMap[student.rollno] = student.name;
    });
  }
  
  return (data || []).map(record => {
    // Look up student name from our map
    const studentName = studentMap[record.student_id] || 'Unknown';
    
    return {
      studentId: record.student_id,
      studentName: studentName,
      date: new Date(record.timestamp).toISOString().split('T')[0],
      timestamp: new Date(record.timestamp).toTimeString().split(' ')[0],
      status: record.status.toLowerCase(),
      verificationMethod: 'face'
    };
  });
}