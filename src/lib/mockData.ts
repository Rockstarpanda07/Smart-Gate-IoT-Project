
export interface Student {
  id: string;
  name: string;
  studentId: string;
  course: string;
  photo?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  date: string;
  status: "present" | "unauthorized" | "failed";
  verificationMethod: "barcode" | "face" | "manual";
}

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Alex Johnson",
    studentId: "ST1001",
    course: "Computer Science",
  },
  {
    id: "2",
    name: "Maria Garcia",
    studentId: "ST1002",
    course: "Electrical Engineering",
  },
  {
    id: "3",
    name: "James Wilson",
    studentId: "ST1003",
    course: "Information Technology",
  },
  {
    id: "4",
    name: "Sophia Chen",
    studentId: "ST1004",
    course: "Data Science",
  },
  {
    id: "5",
    name: "Ahmed Mohammed",
    studentId: "ST1005",
    course: "Cybersecurity",
  },
  {
    id: "6",
    name: "Priya Patel",
    studentId: "ST1006",
    course: "Computer Science",
  },
  {
    id: "7",
    name: "Daniel Kim",
    studentId: "ST1007",
    course: "Artificial Intelligence",
  },
  {
    id: "8",
    name: "Olivia Smith",
    studentId: "ST1008",
    course: "Robotics",
  }
];

export const generateMockAttendance = (days = 7): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  
  // Generate records for the last 'days' days
  for (let d = 0; d < days; d++) {
    const recordDate = new Date();
    recordDate.setDate(now.getDate() - d);
    
    // Each student might have up to 3 entries per day
    mockStudents.forEach(student => {
      const entries = Math.floor(Math.random() * 3) + 1;
      for (let e = 0; e < entries; e++) {
        const hour = 8 + Math.floor(Math.random() * 10); // Between 8AM and 6PM
        const minute = Math.floor(Math.random() * 60);
        
        recordDate.setHours(hour, minute);
        
        // 10% chance of unauthorized or failed attempt
        const randomStatus = Math.random();
        const status = 
          randomStatus > 0.95 ? "unauthorized" : 
          randomStatus > 0.90 ? "failed" : 
          "present";
          
        // 70% face recognition, 30% barcode
        const verificationMethod = Math.random() > 0.3 ? "face" : "barcode";
        
        records.push({
          id: `record-${records.length + 1}`,
          studentId: student.studentId,
          studentName: student.name,
          timestamp: recordDate.toLocaleTimeString(),
          date: recordDate.toLocaleDateString(),
          status,
          verificationMethod
        });
      }
    });
  }
  
  // Sort by date and time (most recent first)
  return records.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.timestamp}`);
    const dateB = new Date(`${b.date} ${b.timestamp}`);
    return dateB.getTime() - dateA.getTime();
  });
};

export const mockAttendance = generateMockAttendance();
