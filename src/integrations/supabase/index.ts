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
  const { data, error } = await supabase
    .from('student_attendance')
    .select(`
      id,
      student_id,
      status,
      timestamp,
      students (name)
    `)
    .order('timestamp', { ascending: false })
    .limit(20)
  
  if (error) throw error
  
  return (data as AttendanceRecord[]).map(record => {
    // Extract student name with proper type handling
    let studentName = 'Unknown';
    
    if (record.students) {
      if (Array.isArray(record.students) && record.students.length > 0) {
        studentName = record.students[0].name || 'Unknown';
      } else if (!Array.isArray(record.students) && record.students.name) {
        studentName = record.students.name;
      }
    }
    
    return {
      name: studentName,
      studentId: record.student_id,
      date: new Date(record.timestamp).toISOString().split('T')[0],
      timestamp: new Date(record.timestamp).toTimeString().split(' ')[0],
      status: record.status.toLowerCase(),
      verificationMethod: 'face'
    };
  });
}