
import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Barcode, User, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Fix duplicate imports - use only one import statement
import { buildApiUrl, API_ENDPOINTS, DATA_SOURCE } from '../config/api';
import { fetchAttendance } from '../integrations/supabase';

interface Student {
  id: string;
  name: string;
  rollno: string;
  studentId: string;
  course: string;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  course: string;
  date: string;
  timestamp: string;
  status: 'present' | 'unauthorized' | 'failed' | 'absent';
  verificationMethod: string;
}

const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    present: true,
    unauthorized: true,
    failed: true,
    absent: true,
  });
  const [methodFilter, setMethodFilter] = useState<Record<string, boolean>>({
    face: true,
    barcode: true,
    manual: true,
    none: true,
  });
  const [students, setStudents] = useState<Student[]>([]);
  // Add missing loading state
  const [loading, setLoading] = useState(false);
  
  // Define fetchAttendanceData outside useEffect
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      let data;
      
      if (DATA_SOURCE.ATTENDANCE === 'supabase') {
        try {
          // Use Supabase for faster performance
          data = await fetchAttendance();
        } catch (supabaseError) {
          console.error('Supabase fetch failed:', supabaseError);
          // Fall back to local API
          const response = await fetch(buildApiUrl(API_ENDPOINTS.ATTENDANCE));
          data = await response.json();
        }
      } else {
        // Fallback to local API
        const response = await fetch(buildApiUrl(API_ENDPOINTS.ATTENDANCE));
        data = await response.json();
      }
      
      // Check if data is valid
      if (Array.isArray(data)) {
        setAttendanceData(data);
      } else {
        console.error('Invalid attendance data format');
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Define fetchStudents function
  const fetchStudents = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS));
      if (response.ok) {
        const rawData = await response.json();
        
        if (Array.isArray(rawData)) {
          const validatedStudents = rawData.map((student: any) => ({
            id: student.id ? student.id.toString() : 'unknown',
            name: typeof student.name === 'string' ? student.name : 'Unknown',
            rollno: typeof student.rollno === 'string' ? student.rollno : 'N/A',
            studentId: typeof student.rollno === 'string' ? student.rollno : 
                       typeof student.studentId === 'string' ? student.studentId : 'N/A',
            course: typeof student.course === 'string' ? student.course : ""
          }));
          setStudents(validatedStudents);
        } else {
          console.error("Invalid students data format: expected an array");
          setStudents([]);
        }
      } else {
        console.error("Failed to fetch students:", response.statusText);
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };
  
  useEffect(() => {
    // Call the fetchAttendanceData function defined above
    fetchAttendanceData();
    fetchStudents();
    const interval = setInterval(() => {
      fetchAttendanceData();
      fetchStudents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const mergedData = students.map(student => {
    const attendanceRecord = attendanceData.find(a => a.studentId === student.studentId || a.studentId === student.rollno);
    return {
      studentId: student.studentId,
      studentName: student.name,
      course: student.course,
      date: attendanceRecord?.date || 'No record',
      timestamp: attendanceRecord?.timestamp || 'N/A',
      status: attendanceRecord?.status || 'absent',
      verificationMethod: attendanceRecord?.verificationMethod || 'none'
    };
  });

  const filteredData = mergedData.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter[record.status];
    const matchesMethod = methodFilter[record.verificationMethod];
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Attendance Logs
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-full sm:w-[200px]"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.present}
                    onCheckedChange={(checked) =>
                      setStatusFilter({ ...statusFilter, present: checked })
                    }
                  >
                    Present
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.unauthorized}
                    onCheckedChange={(checked) =>
                      setStatusFilter({ ...statusFilter, unauthorized: checked })
                    }
                  >
                    Unauthorized
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.failed}
                    onCheckedChange={(checked) =>
                      setStatusFilter({ ...statusFilter, failed: checked })
                    }
                  >
                    Failed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.absent}
                    onCheckedChange={(checked) =>
                      setStatusFilter({ ...statusFilter, absent: checked })
                    }
                  >
                    Absent/No Record
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Method
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.face}
                    onCheckedChange={(checked) =>
                      setMethodFilter({ ...methodFilter, face: checked })
                    }
                  >
                    Face Recognition
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.barcode}
                    onCheckedChange={(checked) =>
                      setMethodFilter({ ...methodFilter, barcode: checked })
                    }
                  >
                    Barcode Scan
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.manual}
                    onCheckedChange={(checked) =>
                      setMethodFilter({ ...methodFilter, manual: checked })
                    }
                  >
                    Manual Entry
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.none}
                    onCheckedChange={(checked) =>
                      setMethodFilter({ ...methodFilter, none: checked })
                    }
                  >
                    None
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
              <TableRow>
                <TableHead colSpan={6} className="bg-muted/50 text-muted-foreground text-xs">
                  All Registered Students
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((record, idx) => (
                  <TableRow key={record.studentId + idx}>
                    <TableCell>{record.studentName}</TableCell>
                    <TableCell>{record.studentId}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.timestamp}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={record.status === 'unauthorized' ? 'destructive' : 'secondary'}
                        className={record.status === 'present' ? 'bg-green-500 text-white border-transparent hover:bg-green-600' : ''}
                      >
                        {record.status === 'absent' ? 'No Record' : 
                         record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.verificationMethod === 'none' ? '-' : record.verificationMethod}</TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                    Student details could not be fetched. Please check your connection.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No matching records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
