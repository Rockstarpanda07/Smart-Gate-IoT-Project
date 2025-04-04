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
import { 
  Student, 
  fetchStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  generateUniqueStudentId
} from "@/services/supabase-service";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseType, SectionType, courseDisplayNames } from "@/components/StudentDrawer";

interface AdminDashboardProps {
  courseFilter: CourseType | null;
  sectionFilter: SectionType | null;
}

const AdminDashboard = ({ courseFilter, sectionFilter }: AdminDashboardProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    course: "B.Tech CSE - IoT" as CourseType,
    section: "A" as SectionType,
    enrollmentYear: new Date().getFullYear()
  });

  // Fetch students when component mounts or filters change
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchStudents(courseFilter, sectionFilter);
        setStudents(data);
      } catch (error) {
        console.error("Error loading students:", error);
        toast({
          variant: "destructive",
          title: "Error loading students",
          description: "There was an issue connecting to the database."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [courseFilter, sectionFilter, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddDialog = () => {
    setCurrentStudent(null);
    setFormData({
      name: "",
      course: "B.Tech CSE - IoT" as CourseType,
      section: "A" as SectionType,
      enrollmentYear: new Date().getFullYear()
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setCurrentStudent(student);
    setFormData({
      name: student.name,
      course: student.course,
      section: student.section,
      enrollmentYear: parseInt(student.student_id.substring(0, 2)) + 2000
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setCurrentStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (currentStudent) {
        // Edit existing student
        const updated = await updateStudent(currentStudent.id, {
          name: formData.name,
          course: formData.course,
          section: formData.section
        });
        
        // Update local state
        setStudents(students.map(student => 
          student.id === currentStudent.id ? updated : student
        ));
        
        toast({
          title: "Student updated",
          description: `${updated.name} has been successfully updated.`
        });
      } else {
        // Generate unique student ID
        const studentId = await generateUniqueStudentId(formData.enrollmentYear, formData.course);
        
        // Add new student
        const newStudent = await createStudent({
          student_id: studentId,
          name: formData.name,
          course: formData.course,
          section: formData.section
        });
        
        // Update local state
        setStudents([...students, newStudent]);
        
        toast({
          title: "Student added",
          description: `${newStudent.name} has been successfully added with ID ${newStudent.student_id}.`
        });
      }
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast({
        variant: "destructive",
        title: "Database error",
        description: error.message || "Could not save student data. Please check your connection and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentStudent) return;
    
    setIsLoading(true);
    try {
      await deleteStudent(currentStudent.id);
      
      // Update local state
      setStudents(students.filter(student => student.id !== currentStudent.id));
      
      toast({
        title: "Student deleted",
        description: `${currentStudent.name} has been successfully deleted.`
      });
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast({
        variant: "destructive",
        title: "Database error",
        description: error.message || "Could not delete student. Please try again."
      });
    } finally {
      setIsLoading(false);
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
              
              <Button onClick={openAddDialog} size="sm" className="h-9" disabled={isLoading}>
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
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>{student.section}</TableCell>
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
                    <TableCell colSpan={5} className="text-center py-8">
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
            
            {!currentStudent && (
              <div className="space-y-2">
                <Label htmlFor="enrollmentYear">Enrollment Year</Label>
                <Input
                  id="enrollmentYear"
                  name="enrollmentYear"
                  type="number"
                  min="2000"
                  max="2099"
                  value={formData.enrollmentYear}
                  onChange={(e) => setFormData({...formData, enrollmentYear: parseInt(e.target.value)})}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select
                value={formData.course}
                onValueChange={(value) => handleSelectChange("course", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(courseDisplayNames).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => handleSelectChange("section", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : currentStudent ? "Save Changes" : "Add Student"}
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
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
