// services/CsvUploaderCivil.jsx
import React from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";   // ✅ icon
import { addEmigrant } from "../services/emigrantsService";

export default function CsvUploaderCivil({ fetchData }) {
  const handleCivilStatusCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      beforeFirstChunk: (chunk) => {
        const rows = chunk.split(/\r\n|\r|\n/);

        // 🔎 Find the row that contains "Year"
        const headerRowIndex = rows.findIndex((row) =>
          row.toLowerCase().includes("year")
        );

        if (headerRowIndex > 0) {
          // Remove everything before the real header
          return rows.slice(headerRowIndex).join("\n");
        }
        return chunk;
      },
      header: true,
      complete: async (results) => {
        const rows = results.data;

        console.log("✅ Cleaned first row:", rows[0]);
        console.log("✅ Headers:", Object.keys(rows[0] || {}));

        const cleaned = rows
          .map((r) => {
            const normalized = {};
            for (let key in r) {
              if (!key) continue;
              normalized[key.trim().toLowerCase()] = r[key];
            }

            return {
              year: Number(normalized["year"]),
              single: parseInt((normalized["single"] || "0").replace(/,/g, "")),
              married: parseInt((normalized["married"] || "0").replace(/,/g, "")),
              widower:
                parseInt((normalized["widower"] || "0").replace(/,/g, "")) ||
                parseInt((normalized["widow/widower"] || "0").replace(/,/g, "")),
              separated: parseInt((normalized["separated"] || "0").replace(/,/g, "")),
              divorced: parseInt((normalized["divorced"] || "0").replace(/,/g, "")),
              notReported: parseInt(
                (normalized["not reported"] || normalized["notreported"] || "0").replace(/,/g, "")
              ),
            };
          })
          .filter((r) => r.year && r.year >= 1988 && r.year <= 2020);

        try {
          for (let row of cleaned) {
            await addEmigrant(row);
          }
          await fetchData();
          alert("✅ Civil Status CSV uploaded and saved successfully!");
        } catch (err) {
          console.error("❌ Error saving Civil Status CSV:", err);
        }
      },
      error: (err) => {
        console.error("❌ PapaParse failed:", err);
      },
    });
  };

  // ✅ Inline styles so this matches your sex/education uploaders
  const styles = {
    uploadCard: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "12px",
      backgroundColor: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    uploadHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px",
      fontWeight: "600",
      fontSize: "14px",
    },
    fileInput: {
      display: "block",
    },
  };

  return (
    <div style={styles.uploadCard}>
      <div style={styles.uploadHeader}>
        <Upload size={20} />
        <span>Upload Civil Status CSV</span>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleCivilStatusCsvUpload}
        style={styles.fileInput}
      />
    </div>
  );
}
