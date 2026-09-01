import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Question, QuestionOption, QuestionType } from "@/types/question";

export interface RowError {
  rowNumber: number;
  questionNumber?: string | number;
  error: string;
  rawData: any;
}

export interface ValidationResult {
  totalCount: number;
  validCount: number;
  errorCount: number;
  validQuestions: Question[];
  errors: RowError[];
}

export async function parseAndValidateQuestions(
  file: File,
  quizId = "temp_quiz"
): Promise<ValidationResult> {
  const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
  const isCsv = file.name.endsWith(".csv");

  if (!isExcel && !isCsv) {
    throw new Error("Invalid file format. Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.");
  }

  let rawRows: any[] = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    rawRows = parsed.data;
  }

  if (rawRows.length === 0) {
    throw new Error("The uploaded file contains no data rows.");
  }

  const validQuestions: Question[] = [];
  const errors: RowError[] = [];
  const seenQuestionNumbers = new Set<string>();
  const seenQuestionTexts = new Set<string>();

  rawRows.forEach((row: any, idx: number) => {
    const rowNum = idx + 2; // Row 1 is header in spreadsheet

    // Normalize keys (trim whitespace and handle case)
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = String(row[key] ?? "").trim();
    }

    const rawQNo = normalized["question no"] || normalized["questionno"] || normalized["qno"] || normalized["no"] || `${idx + 1}`;
    const questionText = normalized["question"] || normalized["question text"] || normalized["questiontext"] || "";
    const optA = normalized["option a"] || normalized["optiona"] || normalized["opt a"] || "";
    const optB = normalized["option b"] || normalized["optionb"] || normalized["opt b"] || "";
    const optC = normalized["option c"] || normalized["optionc"] || normalized["opt c"] || "";
    const optD = normalized["option d"] || normalized["optiond"] || normalized["opt d"] || "";
    const rawCorrect = (normalized["correct answer"] || normalized["correctanswer"] || normalized["answer"] || "").toUpperCase();
    const rawTime = normalized["time limit"] || normalized["timelimit"] || normalized["time"] || "20";
    const rawPoints = normalized["points"] || normalized["point"] || normalized["score"] || "1000";
    const explanation = normalized["explanation"] || normalized["explain"] || "";

    // 1. Check for empty question
    if (!questionText) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: "Question text is empty.",
        rawData: row,
      });
      return;
    }

    // 2. Check for duplicate question numbers or exact duplicate questions
    if (seenQuestionNumbers.has(rawQNo)) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: `Duplicate Question Number '${rawQNo}'.`,
        rawData: row,
      });
      return;
    }
    seenQuestionNumbers.add(rawQNo);

    if (seenQuestionTexts.has(questionText.toLowerCase())) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: `Duplicate question text found: '${questionText.slice(0, 30)}...'.`,
        rawData: row,
      });
      return;
    }
    seenQuestionTexts.add(questionText.toLowerCase());

    // 3. Validate options (At least Option A and Option B must be present)
    if (!optA || !optB) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: "At least Option A and Option B must be provided.",
        rawData: row,
      });
      return;
    }

    // Build options list
    const options: QuestionOption[] = [
      { id: "opt_a", text: optA },
      { id: "opt_b", text: optB },
    ];
    if (optC) options.push({ id: "opt_c", text: optC });
    if (optD) options.push({ id: "opt_d", text: optD });

    // 4. Validate Correct Answer
    if (!rawCorrect) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: "Correct Answer is missing.",
        rawData: row,
      });
      return;
    }

    // Parse correct answers (supports "A", "B", "C", "D", "A,B", "TRUE", "FALSE")
    const correctParts = rawCorrect
      .replace(/[^A-D,]/g, "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    let correctOptionIds: string[] = [];

    // Check if True/False format
    if (
      optA.toLowerCase() === "true" &&
      optB.toLowerCase() === "false" &&
      (rawCorrect === "TRUE" || rawCorrect === "FALSE" || rawCorrect === "T" || rawCorrect === "F")
    ) {
      correctOptionIds = rawCorrect.startsWith("T") ? ["opt_a"] : ["opt_b"];
    } else {
      for (const part of correctParts) {
        if (part === "A" && optA) correctOptionIds.push("opt_a");
        else if (part === "B" && optB) correctOptionIds.push("opt_b");
        else if (part === "C" && optC) correctOptionIds.push("opt_c");
        else if (part === "D" && optD) correctOptionIds.push("opt_d");
      }
    }

    if (correctOptionIds.length === 0) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: `Invalid Correct Answer '${rawCorrect}'. Must match available options (A, B, C, D).`,
        rawData: row,
      });
      return;
    }

    // 5. Validate Time Limit
    const timeLimit = parseInt(rawTime, 10);
    if (isNaN(timeLimit) || timeLimit < 5 || timeLimit > 300) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: `Invalid Time Limit '${rawTime}'. Must be between 5 and 300 seconds.`,
        rawData: row,
      });
      return;
    }

    // 6. Validate Points
    const points = parseInt(rawPoints, 10);
    if (isNaN(points) || points < 100 || points > 10000) {
      errors.push({
        rowNumber: rowNum,
        questionNumber: rawQNo,
        error: `Invalid Points '${rawPoints}'. Must be between 100 and 10000.`,
        rawData: row,
      });
      return;
    }

    // Determine type
    let questionType: QuestionType = "single_choice";
    if (optA.toLowerCase() === "true" && optB.toLowerCase() === "false" && !optC && !optD) {
      questionType = "true_false";
    } else if (correctOptionIds.length > 1) {
      questionType = "multiple_choice";
    }

    validQuestions.push({
      id: `q_up_${Date.now()}_${idx}`,
      quizId,
      orderNumber: validQuestions.length + 1,
      questionText,
      type: questionType,
      options,
      correctOptionIds,
      timeLimit,
      points,
      explanation: explanation || undefined,
      createdAt: Date.now(),
    });
  });

  return {
    totalCount: rawRows.length,
    validCount: validQuestions.length,
    errorCount: errors.length,
    validQuestions,
    errors,
  };
}

export function downloadErrorReport(errors: RowError[], filename = "DQUIZ_Upload_Error_Report.xlsx") {
  const errorData = errors.map((err) => ({
    "Row Number": err.rowNumber,
    "Question No": err.questionNumber || "N/A",
    "Error Description": err.error,
    "Raw Question": err.rawData?.["Question"] || err.rawData?.["question"] || "",
    "Raw Correct Answer": err.rawData?.["Correct Answer"] || err.rawData?.["correct answer"] || "",
  }));

  const ws = XLSX.utils.json_to_sheet(errorData);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 45 },
    { wch: 40 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Upload Errors");
  XLSX.writeFile(wb, filename);
}
