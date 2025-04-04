import { supabase } from "@/integrations/supabase/client";

export type CourseType = "B.Tech CSE - IoT" | "B.Tech CSE - CS" | "B.Tech CSE - AI&DS";
export type SectionType = "A" | "B";

export interface Student {
  id: string;
  student_id: string;
  name: string;
  course: CourseType;
  section: SectionType;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  student_id: string;
  timestamp: string;
  status: string;
  verification_type: string;
  verification_success: boolean;
  student?: Student;
}

// Student functions
export const fetchStudents = async (course?: CourseType | null, section?: SectionType | null) => {
  let query = supabase.from("students").select("*");
  
  if (course) {
    query = query.eq("course", course);
  }
  
  if (section) {
    query = query.eq("section", section);
  }
  
  const { data, error } = await query.order("name");
  
  if (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
  
  return data as Student[];
};

export const createStudent = async (student: Omit<Student, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("students")
    .insert(student)
    .select()
    .single();
  
  if (error) {
    console.error("Error creating student:", error);
    throw error;
  }
  
  return data as Student;
};

export const updateStudent = async (id: string, student: Partial<Omit<Student, "id" | "created_at">>) => {
  const { data, error } = await supabase
    .from("students")
    .update(student)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating student:", error);
    throw error;
  }
  
  return data as Student;
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};

// Attendance functions
export const fetchAttendanceLogs = async () => {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(`
      *,
      students (*)
    `)
    .order("timestamp", { ascending: false });
  
  if (error) {
    console.error("Error fetching attendance logs:", error);
    throw error;
  }
  
  // Transform the nested student object
  const formattedData = data.map(log => ({
    ...log,
    student: log.students as Student
  }));
  
  return formattedData as AttendanceLog[];
};

// Generate student ID based on the pattern yyvvvrrr
export const generateStudentId = (enrollmentYear: number, course: CourseType): string => {
  const yearCode = String(enrollmentYear).slice(-2);
  
  // Course code (vvv): 110 for all as specified
  const courseCode = "110";
  
  // Generate random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `${yearCode}${courseCode}${randomNum}`;
};

// Utility to check if a student ID already exists
export const checkStudentIdExists = async (studentId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("students")
    .select("student_id")
    .eq("student_id", studentId)
    .single();
  
  if (error && error.code !== "PGRST116") { // PGRST116 is the error code when no rows are returned
    console.error("Error checking student ID:", error);
    throw error;
  }
  
  return !!data;
};

// Generate a unique student ID
export const generateUniqueStudentId = async (enrollmentYear: number, course: CourseType): Promise<string> => {
  let studentId = generateStudentId(enrollmentYear, course);
  let exists = await checkStudentIdExists(studentId);
  
  // Keep generating IDs until we find a unique one
  while (exists) {
    studentId = generateStudentId(enrollmentYear, course);
    exists = await checkStudentIdExists(studentId);
  }
  
  return studentId;
};
