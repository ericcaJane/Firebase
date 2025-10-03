// src/components/educationCsvService.js
import Papa from "papaparse";
import { addEducationRecord } from "../services/educationService";

export async function parseEducationCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let rows = results.data;

          // 🔑 Skip title row(s)
          rows = rows.slice(2);

          // First row = years
          const yearRow = rows[0].map((h) => (h || "").trim());
          const years = yearRow.filter((y) => /^\d{4}$/.test(y));

          // Remaining rows = categories
          const categoryRows = rows.slice(1);

          // 🔄 Flexible parser for labels
          function mapCategory(label) {
            const norm = (label || "").trim().toUpperCase();
            if (norm.includes("NO FORMAL") || norm.includes("NO GRADE")) return "noGrade";
            if (norm.includes("ELEMENTARY")) return "elementary";
            if (norm.includes("HIGH")) return "highschool";
            if (norm.includes("COLLEGE")) return "college";
            if (norm.includes("POST")) return "postgrad";
            if (norm.includes("NOT")) return "notReported";
            return null;
          }

          // 🔄 Build per-year objects
          const formatted = years.map((year, yearIndex) => {
            const obj = { year: Number(year) };

            categoryRows.forEach((row) => {
              const label = row[0];
              const key = mapCategory(label);
              if (key) {
                const val = (row[yearIndex + 1] || "0").toString().replace(/,/g, "");
                obj[key] = Number(val) || 0;
              }
            });

            return obj;
          });

          // ✅ Save
          for (let r of formatted) {
            await addEducationRecord(r);
          }

          console.log("Parsed education records:", formatted);
          resolve(formatted);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
