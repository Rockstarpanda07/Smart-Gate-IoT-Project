import React from 'react';
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MockAttendanceTable: React.FC = () => {
  // Mock attendance data
  const attendanceData = [
    {
      name: "Pranav Prakash",
      studentId: "24110348",
      date: "2025-05-07",
      timestamp: "14:12:35",
      status: "proxy",
      verificationMethod: "partially verified"
    },
    {
      name: "Prasanth",
      studentId: "24110045",
      date: "2025-05-07",
      timestamp: "14:15:22",
      status: "present",
      verificationMethod: "fully verified"
    },
    {
      name: "Pratyussh",
      studentId: "24110415",
      date: "2025-05-07",
      timestamp: "14:17:48",
      status: "present",
      verificationMethod: "fully verified"
    },
    {
        name: "Sunil R",
        studentId: "24110484",
        date: "No record",
        timestamp: "N/A",
        status: "No record",
        verificationMethod: "none"
      }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5 py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Attendance Logs
        </CardTitle>
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
            </TableHeader>
            <TableBody>
              {attendanceData.map((record, idx) => (
                <TableRow key={record.studentId + idx}>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.studentId}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.timestamp}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.status === 'proxy' ? 'warning' : 'secondary'}
                      className={record.status === 'present' ? 'bg-green-500 text-white border-transparent hover:bg-green-600' : ''}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={
                        record.status === 'present' ? 'bg-green-500 text-white border-transparent hover:bg-green-600' : 
                        record.status === 'proxy' ? 'bg-yellow-500 text-white border-transparent hover:bg-yellow-600' : ''
                      }
                    >
                      {record.verificationMethod.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
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

export default MockAttendanceTable;