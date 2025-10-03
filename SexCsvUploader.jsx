// components/SexCsvUploader.jsx
import React from "react";
import Papa from "papaparse";

export default function SexCsvUploader({ onDataLoaded }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: false, // because the CSV has messy headers
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        // Extract YEAR, MALE, FEMALE (columns 2, 3, 4 in your file)
        const cleaned = rows
          .map((r) => ({
            YEAR: r[2],
            MALE: r[3],
            FEMALE: r[4],
          }))
          .filter((r) => /^\d+$/.test(r.YEAR)) // keep only numeric years
          .map((r) => ({
            YEAR: Number(r.YEAR),
            MALE: parseInt((r.MALE || "0").replace(/,/g, "")),
            FEMALE: parseInt((r.FEMALE || "0").replace(/,/g, "")),
          }))
          .filter((r) => r.YEAR >= 1981 && r.YEAR <= 2020);

        onDataLoaded(cleaned);
      },
    });
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label>Upload Emigrants CSV (Sex by Year)</label>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
    </div>
  );
}
