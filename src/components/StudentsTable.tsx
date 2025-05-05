import { useState, useEffect } from "react";
import { Users, Search, PlusCircle, Pencil, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

interface Student {
  id: string;
  name: string;
  rollno: string;
  course: string;
  dob: string;
  email: string;
}

const StudentsTable = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS));
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const validatedStudents = data.map((student: any) => ({
            id: student.id ? student.id.toString() : 'unknown',
            name: typeof student.name === 'string' ? student.name : 'Unknown',
            rollno: typeof student.rollno === 'string' ? student.rollno : 'N/A',
            course: typeof student.course === 'string' ? student.course : "",
            dob: typeof student.dob === 'string' ? student.dob : "",
            email: typeof student.email === 'string' ? student.email : ""
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // Refresh data every 10 seconds
    const interval = setInterval(fetchStudents, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Database
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-full sm:w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading students data...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.id}</TableCell>
                    <TableCell>{student.rollno}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.course || 'N/A'}</TableCell>
                    <TableCell>{student.dob || 'N/A'}</TableCell>
                    <TableCell>{student.email || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No students found
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

export default StudentsTable;