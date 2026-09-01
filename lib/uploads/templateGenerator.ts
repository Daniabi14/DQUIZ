import * as XLSX from "xlsx";

export const TEMPLATE_COLUMNS = [
  "Question No",
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Time Limit",
  "Points",
  "Explanation",
];

export const SAMPLE_TEMPLATE_DATA = [
  {
    "Question No": 1,
    "Question": "What is Python?",
    "Option A": "Programming Language",
    "Option B": "Database",
    "Option C": "Web Browser",
    "Option D": "Operating System",
    "Correct Answer": "A",
    "Time Limit": 20,
    "Points": 1000,
    "Explanation": "Python is a high-level, general-purpose programming language.",
  },
  {
    "Question No": 2,
    "Question": "HTML stands for HyperText Markup Language.",
    "Option A": "True",
    "Option B": "False",
    "Option C": "",
    "Option D": "",
    "Correct Answer": "A",
    "Time Limit": 15,
    "Points": 1000,
    "Explanation": "HTML is the standard markup language for documents designed to be displayed in a web browser.",
  },
  {
    "Question No": 3,
    "Question": "Which protocol is used for secure communications over the Internet?",
    "Option A": "HTTP",
    "Option B": "HTTPS",
    "Option C": "FTP",
    "Option D": "Telnet",
    "Correct Answer": "B",
    "Time Limit": 20,
    "Points": 1000,
    "Explanation": "HTTPS encrypts communications using TLS/SSL.",
  },
  {
    "Question No": 4,
    "Question": "Which of the following are JavaScript front-end frameworks/libraries? (Multiple Correct)",
    "Option A": "React",
    "Option B": "Vue",
    "Option C": "Django",
    "Option D": "Angular",
    "Correct Answer": "A, B, D",
    "Time Limit": 30,
    "Points": 1500,
    "Explanation": "Django is a Python back-end web framework.",
  },
];

export function downloadExcelTemplate(filename = "DQUIZ_Question_Template.xlsx") {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA, { header: TEMPLATE_COLUMNS });
  
  // Set column widths for clean readability
  ws["!cols"] = [
    { wch: 12 }, // Question No
    { wch: 45 }, // Question
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 12 }, // Time Limit
    { wch: 10 }, // Points
    { wch: 45 }, // Explanation
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
  XLSX.writeFile(wb, filename);
}

export function downloadCsvTemplate(filename = "DQUIZ_Question_Template.csv") {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA, { header: TEMPLATE_COLUMNS });
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
