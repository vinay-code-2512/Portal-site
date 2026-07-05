export interface DummyStudent {
  userId: string;
  userName: string;
  userEmail: string;
  courses: string[];
  totalPaid: number;
}

export const DUMMY_STUDENTS: DummyStudent[] = [
  {
    userId: "1",
    userName: "Vinay Singh",
    userEmail: "vinayrajput0916@gmail.com",
    courses: ["Finance"],
    totalPaid: 35400,
  },
  {
    userId: "2",
    userName: "Priya Sharma",
    userEmail: "priya.sharma@gmail.com",
    courses: ["Advanced Digital Marketing", "HR"],
    totalPaid: 60000,
  },
  {
    userId: "3",
    userName: "Rahul Verma",
    userEmail: "rahul.verma@yahoo.com",
    courses: ["Data Science & Data Analytics"],
    totalPaid: 35400,
  },
  {
    userId: "4",
    userName: "Ananya Gupta",
    userEmail: "ananya.gupta@gmail.com",
    courses: ["Finance"],
    totalPaid: 5000,
  },
  {
    userId: "5",
    userName: "Amit Kumar",
    userEmail: "amit.kumar@outlook.com",
    courses: ["AI Tools & Automation", "Digital Marketing Diploma", "HR"],
    totalPaid: 90000,
  },
  {
    userId: "6",
    userName: "Neha Patel",
    userEmail: "neha.patel@gmail.com",
    courses: ["Finance"],
    totalPaid: 35400,
  },
];
