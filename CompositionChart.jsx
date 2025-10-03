import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function CompositionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="noGrade" stackId="1" stroke="#1E3A8A" fill="#3B82F6" name="No Grade Completed" />
        <Area type="monotone" dataKey="elementary" stackId="1" stroke="#047857" fill="#10B981" name="Elementary" />
        <Area type="monotone" dataKey="highSchool" stackId="1" stroke="#B45309" fill="#F59E0B" name="High School" />
        <Area type="monotone" dataKey="vocational" stackId="1" stroke="#6B21A8" fill="#A855F7" name="Vocational" />
        <Area type="monotone" dataKey="college" stackId="1" stroke="#BE123C" fill="#F43F5E" name="College" />
        <Area type="monotone" dataKey="postGrad" stackId="1" stroke="#0F766E" fill="#14B8A6" name="Postgraduate" />
        <Area type="monotone" dataKey="notReported" stackId="1" stroke="#4B5563" fill="#9CA3AF" name="Not Reported" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default CompositionChart;
