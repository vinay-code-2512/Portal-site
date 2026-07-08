export const COURSE_PRICE = 30000;
export const COURSE_CURRENCY = "INR";

export interface Course {
  id: string;
  name: string;
}

export const COURSES: Course[] = [
  { id: "digital-marketing-diploma", name: "Advanced Digital Marketing" },
  { id: "digital-marketing-diploma-program", name: "Digital Marketing Diploma" },
  { id: "data-science-data-analytics", name: "Data Science & Data Analytics" },
  { id: "hr", name: "HR Management" },
  { id: "ai-tools-automation", name: "AI Tools & Automation" },
  { id: "finance", name: "Finance" },
];

export interface Batch {
  id: string;
  name: string;
}

export const BATCHES: Batch[] = [
  { id: "june-august", name: "June to August" },
  { id: "july-august", name: "July to August" },
  { id: "sep-october", name: "Sep to October" },
];
