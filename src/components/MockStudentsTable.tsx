import React from 'react';
import { Users, Search, Pencil, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  name: string;
  rollno: string;
  course: string;
  dob: string;
  email: string;
}

const MockStudentsTable: React.FC = () => {
  // Mock students data based on the provided attendance data
  const students: Student[] = [
    {
      id: "1",
      name: "Pranav Prakash",
      rollno: "24110348",
      course: "Computer Science",
      dob: "2006-05-15",
      email: "prana24110348@snuchennai.edu.in"
    },
    {
      id: "2",
      name: "Prasanth",
      rollno: "24110045",
      course: "Computer Science",
      dob: "2007-03-22",
      email: "prasa24110045@snuchennai.edu.in"
    },
    {
      id: "3",
      name: "Pratyussh",
      rollno: "24110415",
      course: "Computer Science",
      dob: "2006-11-10",
      email: "praty24110415@snuchennai.edu.in"
    },
    {
      id: "4",
      name: "Sunil",
      rollno: "24110484",
      course: "Computer Science",
      dob: "2007-02-10",
      email: "sunil24110484@snuchennai.edu.in"
    }
  ];

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
              {students.map((student) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MockStudentsTable;