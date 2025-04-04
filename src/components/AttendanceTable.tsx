
import { useState } from "react";
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
import { AttendanceRecord, mockAttendance } from "@/lib/mockData";

const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(mockAttendance);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    present: true,
    unauthorized: true,
    failed: true,
  });
  const [methodFilter, setMethodFilter] = useState<Record<string, boolean>>({
    face: true,
    barcode: true,
    manual: true,
  });

  const filteredData = attendanceData.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
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
                    <span>Status</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.present}
                    onCheckedChange={(checked) =>
                      setStatusFilter((prev) => ({ ...prev, present: !!checked }))
                    }
                  >
                    Present
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.unauthorized}
                    onCheckedChange={(checked) =>
                      setStatusFilter((prev) => ({ ...prev, unauthorized: !!checked }))
                    }
                  >
                    Unauthorized
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.failed}
                    onCheckedChange={(checked) =>
                      setStatusFilter((prev) => ({ ...prev, failed: !!checked }))
                    }
                  >
                    Failed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Method</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.face}
                    onCheckedChange={(checked) =>
                      setMethodFilter((prev) => ({ ...prev, face: !!checked }))
                    }
                  >
                    Face Recognition
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.barcode}
                    onCheckedChange={(checked) =>
                      setMethodFilter((prev) => ({ ...prev, barcode: !!checked }))
                    }
                  >
                    Barcode
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={methodFilter.manual}
                    onCheckedChange={(checked) =>
                      setMethodFilter((prev) => ({ ...prev, manual: !!checked }))
                    }
                  >
                    Manual
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
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.studentName}</TableCell>
                    <TableCell>{record.studentId}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {record.verificationMethod === "face" ? (
                          <Badge variant="outline" className="bg-info/10 text-info border-info/30 px-2 py-0 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs">Face</span>
                          </Badge>
                        ) : record.verificationMethod === "barcode" ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 px-2 py-0 flex items-center gap-1">
                            <Barcode className="h-3 w-3" />
                            <span className="text-xs">Barcode</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-muted/30 px-2 py-0">
                            <span className="text-xs">Manual</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.status === "present" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="text-xs">Present</span>
                        </Badge>
                      ) : record.status === "unauthorized" ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Unauthorized</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted/30 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          <span className="text-xs">Failed</span>
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredData.length > 10 && (
          <div className="flex items-center justify-center p-4 border-t">
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
