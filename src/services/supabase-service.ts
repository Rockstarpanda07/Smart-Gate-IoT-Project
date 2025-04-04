import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type CourseType = Database["public"]["Enums"]["course_enum"];
export type SectionType = Database["public"]["Enums"]["section_enum"];

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

// Enable RLS policies first, then try these functions
export const fetchStudents = async (course?: CourseType | null, section?: SectionType | null) => {
  try {
    let query = supabase.from("students").select();
    
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
  } catch (error) {
    console.error("Failed to fetch students:", error);
    throw error;
  }
};

export const createStudent = async (student: Omit<Student, "id" | "created_at">) => {
  try {
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
  } catch (error) {
    console.error("Failed to create student:", error);
    throw error;
  }
};

export const updateStudent = async (id: string, student: Partial<Omit<Student, "id" | "created_at">>) => {
  try {
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
  } catch (error) {
    console.error("Failed to update student:", error);
    throw error;
  }
};

export const deleteStudent = async (id: string) => {
  try {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete student:", error);
    throw error;
  }
};

// Attendance functions
export const fetchAttendanceLogs = async () => {
  try {
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
    
    return data.map(log => ({
      ...log,
      student: log.students as unknown as Student
    })) as AttendanceLog[];
  } catch (error) {
    console.error("Failed to fetch attendance logs:", error);
    return [];
  }
};

// Generate student ID based on the pattern yyvvvrrr
export const generateStudentId = (enrollmentYear: number, course: CourseType): string => {
  const yearCode = String(enrollmentYear).slice(-2);
  
  // Course code (vvv): 110 for all courses
  const courseCode = "110";
  
  // Generate random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `${yearCode}${courseCode}${randomNum}`;
};

// Utility to check if a student ID already exists
export const checkStudentIdExists = async (studentId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle();
    
    if (error && error.code !== "PGRST116") { // PGRST116 is the error code when no rows are returned
      console.error("Error checking student ID:", error);
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error("Failed to check student ID:", error);
    return false;
  }
};

// Generate a unique student ID
export const generateUniqueStudentId = async (enrollmentYear: number, course: CourseType): Promise<string> => {
  let studentId = generateStudentId(enrollmentYear, course);
  let exists = await checkStudentIdExists(studentId);
  
  // Keep generating IDs until we find a unique one
  let attempts = 0;
  while (exists && attempts < 10) {
    studentId = generateStudentId(enrollmentYear, course);
    exists = await checkStudentIdExists(studentId);
    attempts++;
  }
  
  return studentId;
};
