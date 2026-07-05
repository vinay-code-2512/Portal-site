import jsPDF from "jspdf";
import type { PayrollRecord } from "@/lib/payroll";
import { getMonthName } from "@/lib/payroll";

export function generatePayslipPdf(
  record: PayrollRecord,
  employeeName: string,
  employeeId: string,
  department: string
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const col1 = margin;
  const col2 = 100;
  let y = margin;

  const P = [139, 92, 246] as const;
  const G = [120, 120, 130] as const;
  const W = [255, 255, 255] as const;

  doc.setFillColor(15, 15, 26);
  doc.rect(0, 0, pageW, 297, "F");

  doc.setFillColor(P[0], P[1], P[2]);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setTextColor(W[0], W[1], W[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", pageW / 2, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 30, { align: "center" });

  y = 55;

  doc.setTextColor(W[0], W[1], W[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Information", col1, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(G[0], G[1], G[2]);

  const empLines = [
    ["Name:", employeeName],
    ["Employee ID:", employeeId],
    ["Department:", department],
    ["Period:", `${getMonthName(record.month)} ${record.year}`],
  ];

  for (const [label, value] of empLines) {
    doc.setTextColor(G[0], G[1], G[2]);
    doc.text(label, col1, y);
    doc.setTextColor(W[0], W[1], W[2]);
    doc.text(value, col1 + 35, y);
    y += 6;
  }

  y += 6;

  doc.setDrawColor(60, 60, 80);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setTextColor(W[0], W[1], W[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Salary Breakdown", col1, y);
  y += 8;

  const rows: [string, number][] = [
    ["Basic Salary", record.basicSalary],
    ["Allowances", record.allowances],
    ["Bonuses", record.bonuses],
    ["Deductions", -record.deductions],
  ];

  doc.setFontSize(9);
  for (const [label, amount] of rows) {
    const isNeg = amount < 0;
    doc.setTextColor(G[0], G[1], G[2]);
    doc.text(label, col1, y);
    if (isNeg) doc.setTextColor(255, 80, 80);
    else doc.setTextColor(W[0], W[1], W[2]);
    doc.text(`\u20B9 ${Math.abs(amount).toLocaleString("en-IN")}`, col1 + 80, y, { align: "right" });
    y += 7;
  }

  doc.setDrawColor(60, 60, 80);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFillColor(139, 92, 246, 0.15);
  doc.roundedRect(margin, y - 4, pageW - 2 * margin, 12, 2, 2, "F");

  doc.setTextColor(W[0], W[1], W[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Salary", col1, y + 3);
  doc.text(`\u20B9 ${record.netSalary.toLocaleString("en-IN")}`, pageW - margin, y + 3, { align: "right" });

  y += 22;

  doc.setTextColor(G[0], G[1], G[2]);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated payslip.", pageW / 2, y, { align: "center" });

  return doc.output("blob");
}
