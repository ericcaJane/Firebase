// src/services/comparisonDataService.js
import Papa from "papaparse";

export async function parseComparisonCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // don’t trust Papa for multi-line headers
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let rows = results.data;

          // Drop title + blank rows
          rows = rows.slice(2);

          // Combine row[0] + row[1] into full headers
          const headerRow1 = rows[0].map((h) => (h || "").trim().toUpperCase());
          const headerRow2 = rows[1].map((h) => (h || "").trim().toUpperCase());

          const headers = headerRow1.map((h, i) => {
            let combined = (h + " " + (headerRow2[i] || "")).trim();
            if (!combined) combined = `COL_${i}`;
            // clean USA*
            combined = combined.replace("*", "").trim();
            return combined;
          });

          // Remaining rows are data
          rows = rows.slice(2);

          // Map into objects
          const formatted = rows.map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              if (h === "YEAR" || h === "TOTAL") {
                obj[h] = Number(r[i]) || 0;
              } else if (h && h !== "% INC.") {
                obj[h] = Number((r[i] || "0").replace(/,/g, "")) || 0;
              }
            });
            return obj;
          });

          console.log("✅ Headers:", headers);
          console.log("✅ First data row:", formatted[0]);

          resolve(formatted);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}





export function aggregateByDecade(rows) {
  const years = rows.map(r => r.YEAR).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const result = [];

  for (let start = Math.floor(minYear / 10) * 10; start <= maxYear; start += 10) {
    let end = Math.min(start + 9, maxYear);

    // Special case: if it's just 2020
    let decadeLabel;
    if (start === 2020 && end === 2020) {
      decadeLabel = "2020"; // single year bucket
    } else {
      decadeLabel = `${start}s`;
    }

    const filtered = rows.filter(r => r.YEAR >= start && r.YEAR <= end);

    const sums = {};
    filtered.forEach(row => {
      Object.keys(row).forEach(country => {
        if (country === "YEAR" || country === "TOTAL") return;
        sums[country] = (sums[country] || 0) + (row[country] || 0);
      });
    });

    const top10 = Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({
        decade: decadeLabel,
        country,
        count,
      }));

    result.push(...top10);
  }

  return result;
}



