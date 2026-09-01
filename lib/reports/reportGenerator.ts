import * as XLSX from "xlsx";
import {
  ParticipantReportRow,
  QuestionReportRow,
  ResponseReportRow,
  AttendanceReportRow,
} from "@/types/report";

export function exportToExcel(data: any[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportToCsv(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateParticipantReport(
  participants: ParticipantReportRow[],
  quizName: string,
  format: "excel" | "csv" = "excel"
) {
  const sanitizedName = quizName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${sanitizedName}_Participant_Report_${dateStr}.${format === "excel" ? "xlsx" : "csv"}`;

  if (format === "excel") {
    exportToExcel(participants, "Participant Report", filename);
  } else {
    exportToCsv(participants, filename);
  }
}

export function generateQuestionReport(
  questions: QuestionReportRow[],
  quizName: string,
  format: "excel" | "csv" = "excel"
) {
  const sanitizedName = quizName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${sanitizedName}_Question_Report_${dateStr}.${format === "excel" ? "xlsx" : "csv"}`;

  if (format === "excel") {
    exportToExcel(questions, "Question Analytics", filename);
  } else {
    exportToCsv(questions, filename);
  }
}

export function generateResponseReport(
  responses: ResponseReportRow[],
  quizName: string,
  format: "excel" | "csv" = "excel"
) {
  const sanitizedName = quizName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${sanitizedName}_Response_Report_${dateStr}.${format === "excel" ? "xlsx" : "csv"}`;

  if (format === "excel") {
    exportToExcel(responses, "Detailed Responses", filename);
  } else {
    exportToCsv(responses, filename);
  }
}

export function generateAttendanceReport(
  attendance: AttendanceReportRow[],
  quizName: string,
  format: "excel" | "csv" = "excel"
) {
  const sanitizedName = quizName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${sanitizedName}_Attendance_${dateStr}.${format === "excel" ? "xlsx" : "csv"}`;

  if (format === "excel") {
    exportToExcel(attendance, "Attendance", filename);
  } else {
    exportToCsv(attendance, filename);
  }
}
