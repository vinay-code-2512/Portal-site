import jsPDF from "jspdf";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function exportToCsv(
  rows: Record<string, string | number>[],
  filename: string
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename, ".csv");
}

export function exportToExcel(
  rows: Record<string, string | number>[],
  filename: string,
  title?: string
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const headerRow = headers
    .map((h) => `<th style="background:#8b5cf6;color:#fff;padding:6px 10px;text-align:left;font-size:11px">${h}</th>`)
    .join("");
  const dataRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => `<td style="padding:4px 10px;border:1px solid #333;font-size:10px">${row[h] ?? ""}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${filename}</title></head>
<body>
${title ? `<h2 style="color:#fff;font-family:sans-serif">${title}</h2>` : ""}
<table style="border-collapse:collapse;background:#1a1a2e;color:#e5e7eb;font-family:sans-serif;width:100%">
<thead>${headerRow}</thead>
<tbody>${dataRows}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  downloadBlob(blob, filename, ".xls");
}

export function exportReportToPdf(
  title: string,
  sections: { heading: string; rows: [string, string][] }[]
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  let y = margin;

  const P = [139, 92, 246] as const;
  const G = [120, 120, 130] as const;
  const W = [255, 255, 255] as const;
  const DARK = [15, 15, 26] as const;

  doc.setFillColor(DARK[0], DARK[1], DARK[2]);
  doc.rect(0, 0, pageW, 297, "F");

  doc.setFillColor(P[0], P[1], P[2]);
  doc.rect(0, 0, pageW, 30, "F");

  doc.setTextColor(W[0], W[1], W[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageW / 2, 14, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    pageW / 2,
    23,
    { align: "center" }
  );

  y = 42;

  for (const section of sections) {
    if (y > 260) {
      doc.addPage();
      doc.setFillColor(DARK[0], DARK[1], DARK[2]);
      doc.rect(0, 0, pageW, 297, "F");
      y = margin;
    }

    doc.setTextColor(W[0], W[1], W[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(section.heading, margin, y);
    y += 7;

    doc.setTextColor(G[0], G[1], G[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    for (const [label, value] of section.rows) {
      if (y > 275) {
        doc.addPage();
        doc.setFillColor(DARK[0], DARK[1], DARK[2]);
        doc.rect(0, 0, pageW, 297, "F");
        y = margin;
      }
      doc.setTextColor(G[0], G[1], G[2]);
      doc.text(label, margin, y);
      doc.setTextColor(W[0], W[1], W[2]);
      doc.text(value, margin + 60, y);
      y += 5;
    }

    y += 4;
    doc.setDrawColor(60, 60, 80);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  }

  downloadBlob(doc.output("blob"), title.replace(/\s+/g, "_"), ".pdf");
}

function downloadBlob(blob: Blob, filename: string, ext: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
