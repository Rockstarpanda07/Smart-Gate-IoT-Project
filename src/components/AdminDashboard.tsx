
import { useState, useEffect } from "react";
import { Users, PlusCircle, Pencil, Trash, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

interface Student {
  id: string;
  name: string;
  studentId: string;
  course: string;
}

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    course: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENTS));
      if (response.ok) {
        const data = await response.json();
        
        // Validate data is an array before processing
        if (Array.isArray(data)) {
          const validatedStudents = data.map((student: any) => ({
            id: student.id ? student.id.toString() : 'unknown',
            name: typeof student.name === 'string' ? student.name : 'Unknown',
            studentId: typeof student.rollno === 'string' ? student.rollno : 'N/A',
            course: typeof student.course === 'string' ? student.course : ""
          }));
          setStudents(validatedStudents);
          console.log("Fetched students:", validatedStudents); // Add this line for debugging
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddDialog = () => {
    setCurrentStudent(null);
    setFormData({
      name: "",
      studentId: "",
      course: ""
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setCurrentStudent(student);
    setFormData({
      name: student.name,
      studentId: student.studentId,
      course: student.course
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setCurrentStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data before submission
    if (!formData.name.trim() || !formData.studentId.trim()) {
      console.error('Name and Student ID are required fields');
      alert('Please fill in both Name and Student ID.');
      return;
    }
    
    const studentData = {
      name: formData.name.trim(),
      rollno: formData.studentId.trim(),
      course: formData.course.trim()
    };

    try {
      let response;
      const url = currentStudent
        ? buildApiUrl(`${API_ENDPOINTS.STUDENTS}/${currentStudent.id}`)
        : buildApiUrl(API_ENDPOINTS.STUDENTS);
      
      const method = currentStudent ? 'PUT' : 'POST';

      response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });

      if (response.ok) {
        await fetchStudents();
        setIsDialogOpen(false);
        alert(`Student successfully ${currentStudent ? 'updated' : 'added'}!`);
      } else {
        // Parse the error response
        const errorData = await response.json();
        
        // Check for duplicate rollno error
        if (response.status === 500 && errorData.message && errorData.message.includes("Duplicate entry")) {
          alert(`Error: Student ID '${formData.studentId}' already exists. Please use a different ID.`);
        } else {
          console.error(`Failed to ${currentStudent ? 'update' : 'add'} student. Status: ${response.status} ${response.statusText}. Response:`, errorData);
          alert(`Failed to ${currentStudent ? 'update' : 'add'} student: ${errorData.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error(`Error saving student:`, error);
      alert('An unexpected error occurred while saving the student. Please check the console.');
    }
  };

  const handleDelete = async () => {
    if (currentStudent) {
      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.STUDENTS}/${currentStudent.id}`), {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchStudents();
        }
      } catch (error) {
        console.error('Error deleting student:', error);
      }
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="bg-primary/5 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Management
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
              
              <Button onClick={openAddDialog} size="sm" className="h-9">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(student)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(student)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {currentStudent
                ? "Update the student's information in the system."
                : "Add a new student to the attendance system."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                name="studentId"
                placeholder="ST1234"
                value={formData.studentId}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course">Course/Program</Label>
              <Input
                id="course"
                name="course"
                placeholder="Computer Science"
                value={formData.course}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentStudent ? "Save Changes" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentStudent?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
