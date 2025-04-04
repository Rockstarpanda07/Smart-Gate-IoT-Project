
import { useState } from "react";
import { 
  Drawer, 
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Filter, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CourseType = "B.Tech CSE - IoT" | "B.Tech CSE - CS" | "B.Tech CSE - AI&DS";
export type SectionType = "A" | "B";

interface StudentFilterProps {
  onFilterChange: (course: CourseType | null, section: SectionType | null) => void;
  selectedCourse: CourseType | null;
  selectedSection: SectionType | null;
}

export const courseDisplayNames: Record<CourseType, string> = {
  "B.Tech CSE - IoT": "IoT (Internet of Things)",
  "B.Tech CSE - CS": "CS (Cyber Security)",
  "B.Tech CSE - AI&DS": "AI&DS (AI & Data Structures)"
};

export const courseShortNames: Record<CourseType, string> = {
  "B.Tech CSE - IoT": "IoT",
  "B.Tech CSE - CS": "CS",
  "B.Tech CSE - AI&DS": "AI&DS"
};

const StudentDrawer: React.FC<StudentFilterProps> = ({ 
  onFilterChange, 
  selectedCourse, 
  selectedSection 
}) => {
  const [tempCourse, setTempCourse] = useState<CourseType | null>(selectedCourse);
  const [tempSection, setTempSection] = useState<SectionType | null>(selectedSection);
  
  const handleApplyFilters = () => {
    onFilterChange(tempCourse, tempSection);
  };
  
  const handleReset = () => {
    setTempCourse(null);
    setTempSection(null);
    onFilterChange(null, null);
  };
  
  const getFilterCount = () => {
    let count = 0;
    if (selectedCourse) count++;
    if (selectedSection) count++;
    return count;
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          <span>Filter Students</span>
          {getFilterCount() > 0 && (
            <Badge className="h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full absolute -top-2 -right-2">
              {getFilterCount()}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Filter Students</DrawerTitle>
            <DrawerDescription>Filter students by course and section</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Course</h4>
                <RadioGroup
                  value={tempCourse || ""}
                  onValueChange={(val) => setTempCourse(val as CourseType || null)}
                  className="gap-2"
                >
                  {Object.entries(courseDisplayNames).map(([value, label]) => (
                    <div className="flex items-center space-x-2" key={value}>
                      <RadioGroupItem value={value} id={`course-${value}`} />
                      <Label htmlFor={`course-${value}`} className="flex-1">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Section</h4>
                <RadioGroup
                  value={tempSection || ""}
                  onValueChange={(val) => setTempSection(val as SectionType || null)}
                  className="gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="A" id="section-a" />
                    <Label htmlFor="section-a" className="flex-1">Section A</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="B" id="section-b" />
                    <Label htmlFor="section-b" className="flex-1">Section B</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="flex-1 gap-2">
                <Check className="h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <XCircle className="h-4 w-4" />
                Reset
              </Button>
            </div>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default StudentDrawer;
