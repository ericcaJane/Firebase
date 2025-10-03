import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ComparisonChart({ data }) {
  // Collect unique decade labels from dataset
  const availableDecades = [...new Set(data.map((d) => d.decade))];

  // Default to the first available decade
  const [selectedDecade, setSelectedDecade] = useState(
    availableDecades[0] || ""
  );

  // Filter only top 10 for the chosen decade
  const filteredData = data.filter((d) => d.decade === selectedDecade);

  return (
    <div>
      {/* Decade Selector */}
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        {availableDecades.map((dec) => (
          <button
            key={dec}
            onClick={() => setSelectedDecade(dec)}
            style={{
              margin: "0 6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border:
                selectedDecade === dec
                  ? "2px solid #3B82F6"
                  : "1px solid #D1D5DB",
              background: selectedDecade === dec ? "#3B82F6" : "white",
              color: selectedDecade === dec ? "white" : "#374151",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {dec}
          </button>
        ))}
      </div>

      {/* Chart */}
     <ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={filteredData}
    margin={{ top: 20, right: 30, left: 20, bottom: 120 }} // ⬅️ give more space
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="country"
      angle={-45}
      textAnchor="end"
      interval={0}
      height={120}  // ⬅️ more space for rotated labels
      tick={{ fontSize: 12 }}
    />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="count" fill="#3B82F6" />
  </BarChart>
</ResponsiveContainer>

    </div>
  );
}

export default ComparisonChart;
