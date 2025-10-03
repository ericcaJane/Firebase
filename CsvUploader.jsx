import React, { useState } from "react";
import Papa from "papaparse";
import { addRecord } from "../services/emigrantsService";

function CsvUploader({ onUploadComplete }) {
  const [loading, setLoading] = useState(false);

  const detectCollection = (fileName, headers) => {
    const name = fileName.toLowerCase();

    if (name.includes("sex")) return "emigrants_sex";
    if (name.includes("age")) return "emigrants_age";
    if (name.includes("educ")) return "emigrants_education";
    if (name.includes("civil")) return "emigrants_civilstatus";
    if (name.includes("country")) return "emigrants_countries";

    // fallback: detect by headers
    if (headers.includes("male") && headers.includes("female")) return "emigrants_sex";
    if (headers.includes("age") || headers.includes("agegroup")) return "emigrants_age";
    if (headers.includes("single") && headers.includes("married")) return "emigrants_civilstatus";
    if (headers.includes("elementary") || headers.includes("college")) return "emigrants_education";
    if (headers.includes("destination") || headers.includes("country")) return "emigrants_countries";

    return "emigrants_misc"; // fallback
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = results.meta.fields.map((h) => h.toLowerCase());
        const collectionName = detectCollection(file.name, headers);

        console.log(`📂 Saving to collection: ${collectionName}`);

        for (const row of results.data) {
          try {
            await addRecord(collectionName, row);
          } catch (err) {
            console.error(`❌ Error uploading row to ${collectionName}:`, row, err);
          }
        }

        setLoading(false);
        alert(`✅ CSV upload complete → ${collectionName}`);

        if (onUploadComplete) {
          onUploadComplete();
        }
      },
    });
  };

  return (
    <div>
      <h3>Upload CSV Dataset</h3>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {loading && <p>Uploading... Please wait.</p>}
    </div>
  );
}

export default CsvUploader;
