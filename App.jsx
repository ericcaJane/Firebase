
import React, { useEffect, useState } from "react";
import FlowMapUploader from "./components/FlowMapUploader";
import {  Calendar,  RotateCcw, GraduationCap } from "lucide-react";

import HeroSection from "./components/HeroSection";

import Papa from "papaparse"; 
import {
  addEmigrant,
  getEmigrants,
  updateEmigrant,
  deleteEmigrant,
  deleteAllEmigrants
} from "./services/emigrantsService";
import { 
  addEmigrantBySex, 
  getEmigrantsBySex, 
  updateEmigrantBySex,   
  deleteEmigrantBySex,
  deleteAllEmigrantsBySex
} from "./services/emigrantsBySexService";
import { parseComparisonCsv, aggregateByDecade } from "./services/comparisonDataService";
import { 
  addEducationRecord, 
  getEducationRecords, 
  updateEducationRecord, 
  deleteEducationRecord,  
  deleteAllEducationRecords
} from "./services/educationService";

import {
  addEmigrantByAge,
  getEmigrantsByAge,
  updateEmigrantByAge,
  deleteEmigrantByAge,
  deleteAllEmigrantsByAge,
} from "./services/emigrantsByAgeService";

//csv
import { parseEducationCsv } from "./components/educationCsvService";
import CsvUploaderCivil from "./services/CsvUploaderCivil";
import ComparisonChart from "./components/ComparisonChart";


import HeatMap from "react-heatmap-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Plus, Edit2, Trash2, Save, X, Users, TrendingUp, BarChart3, Upload, Database, Globe, FileText, Activity } from "lucide-react";

const initialForm = {
  year: "",
  single: "",
  married: "",
  widower: "",
  separated: "",
  divorced: "",
  notReported: "",
};


// 📌 Put this at the top of your component
const chartDescriptions = {
  trends: "Trends (Line Chart) – Male vs Female emigrants per year",
  comparison: "Comparison (Bar Chart) – Top 10 destination countries by decade",
  composition: "Composition (Stacked Area Chart) – Educational attainment breakdown",
  distribution: "Distribution (Histogram-style) – Age distribution of emigrants by decade",
  relationships: "Relationships (Heatmap) – Civil Status × Time crosstab (marital status × year)",
  geographic: "Geographic Representation (Flow Map) – Migration flows from the Philippines to top destinations "
};




const COLORS = [
  "#3B82F6", // medium blue
  "#60A5FA", // lighter blue
  "#93C5FD", // soft sky blue
  "#BFDBFE", // pale blue
  "#1E40AF", // deep navy
  "#2563EB", // primary blue
];

const fieldLabels = {
  year: "Year",
  single: "Single",
  married: "Married",
  widower: "Widower",
  separated: "Separated",
  divorced: "Divorced",
  notReported: "Not Reported",
};

function App() {
  // ================== FILTER STATES ==================
const [yearRange, setYearRange] = useState([1980, 2020]);  // global year filter
const [selectedSex, setSelectedSex] = useState("all");     // male/female filter
const [selectedAgeGroups, setSelectedAgeGroups] = useState([]); // age groups filter
const [selectedEducation, setSelectedEducation] = useState([]);//education filter
const [hoverRow, setHoverRow] = useState(null);
const [hoverCol, setHoverCol] = useState(null);
// Add at top-level state (same level as yearRange, etc.)
const [multiSelect, setMultiSelect] = useState(false);


  const [emigrants, setEmigrants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [activeChart, setActiveChart] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // NEW: State for male/female trend data
  const [sexTrendData, setSexTrendData] = useState([]);
  // Sex dataset form and editing
const [sexForm, setSexForm] = useState({ year: "", male: "", female: "" });
const [sexEditingId, setSexEditingId] = useState(null);
const [sexEditForm, setSexEditForm] = useState({ year: "", male: "", female: "" });


// Education dataset
const [educationData, setEducationData] = useState([]);
const [educationForm, setEducationForm] = useState({
  year: "",
  elementary: "",
  highschool: "",
  college: "",
  postgrad: "",
  notReported: "",
});
const [educationEditingId, setEducationEditingId] = useState(null);
const [educationEditForm, setEducationEditForm] = useState(educationForm);


  //filter 
  const [activeDataset, setActiveDataset] = useState("emigrants"); 
  const [activeVisualization, setActiveVisualization] = useState("trends");
  const [comparisonData, setComparisonData] = useState([]);
  // how many rows to show in table
const [recordsLimit, setRecordsLimit] = useState("all");


// Age dataset state
const [ageData, setAgeData] = useState([]);
const [ageForm, setAgeForm] = useState({ year: "", ageGroup: "", count: "" });
const [ageEditingId, setAgeEditingId] = useState(null);
const [ageEditForm, setAgeEditForm] = useState({ year: "", ageGroup: "", count: "" });

const fetchAgeData = async () => {
  try {
    const data = await getEmigrantsByAge();
    const sorted = (data || []).sort((a, b) => a.year - b.year);
    setAgeData(sorted); // ✅ update state
  } catch (err) {
    console.error("Error fetching age data:", err);
  }
};


useEffect(() => {
  fetchAgeData();
}, []);

// Helper: map year → decade
const getDecade = (year) => {
  if (!year) return "Other";
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;  // e.g. 2025 → "2020s", 2033 → "2030s"
};




// Aggregate counts
// Rename this to avoid collision
// Put this above aggregateAgeByDecade
const ageOrder = [
  "14 - Below",
  "15 - 19",
  "20 - 24",
  "25 - 29",
  "30 - 34",
  "35 - 39",
  "40 - 44",
  "45 - 49",
  "50 - 54",
  "55 - 59",
  "60 - 64",
  "65 - 69",
  "70 - Above",
];

// ✅ Normalize age group strings to match predefined categories
const normalizeAgeGroup = (ageGroup) => {
  if (!ageGroup) return "";
  return ageGroup
    .replace(/[–—]/g, "-")  // replace en dash/em dash → hyphen
    .replace(/\s*-\s*/g, " - ") // normalize spacing around dash
    .trim();
};

const aggregateAgeByDecade = (ageData) => {
  const grouped = {};

  ageData.forEach((row) => {
    const decade = getDecade(row.year);
    if (decade === "Other") return;

    // ✅ Normalize the key before grouping
    const key = normalizeAgeGroup(row.ageGroup);

    if (!grouped[key]) grouped[key] = { ageGroup: key };
    grouped[key][decade] = (grouped[key][decade] || 0) + row.count;
  });

  // ✅ Sort based on ageOrder
  return Object.values(grouped).sort(
    (a, b) => ageOrder.indexOf(a.ageGroup) - ageOrder.indexOf(b.ageGroup)
  );
};





// Add new record
const handleAgeAdd = async () => {
  try {
    const newRecord = await addEmigrantByAge({
      year: Number(ageForm.year),
      ageGroup: normalizeAgeGroup(ageForm.ageGroup),
      count: Number(ageForm.count) || 0,
    });

    setAgeData((prev) => [...prev, newRecord]); // ✅ add directly
    setAgeForm({ year: "", ageGroup: "", count: "" });
    alert("✅ Age record added!");
  } catch (err) {
    console.error("Error adding age record:", err);
    alert("❌ Failed to add age record.");
  }
};


// Delete one
const handleAgeDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this age record?")) return;
  try {
    await deleteEmigrantByAge(id);
    await fetchAgeData();
    alert("🗑️ Age record deleted!");
  } catch (err) {
    console.error("Error deleting age record:", err);
    alert("❌ Failed to delete record.");
  }
};

// Delete all
const handleDeleteAllAge = async () => {
  if (!window.confirm("⚠️ Delete ALL age records? This cannot be undone.")) return;
  try {
    await deleteAllEmigrantsByAge();
    await fetchAgeData();
    alert("🗑️ All age records deleted!");
  } catch (err) {
    console.error("Error deleting all age records:", err);
    alert("❌ Failed to delete all records.");
  }
};

// Start edit
const startAgeEdit = (record) => {
  setAgeEditingId(record.id);
  setAgeEditForm(record);
};

// Cancel edit
const cancelAgeEdit = () => {
  setAgeEditingId(null);
  setAgeEditForm({ year: "", ageGroup: "", count: "" });
};

// Save edit
const saveAgeEdit = async (id) => {
  try {
   await updateEmigrantByAge(id, {
  year: Number(ageEditForm.year),
  ageGroup: normalizeAgeGroup(ageEditForm.ageGroup),
  count: Number(ageEditForm.count) || 0,
});

    setAgeEditingId(null);
    await fetchAgeData();
    alert("✅ Age record updated!");
  } catch (err) {
    console.error("Error updating age record:", err);
    alert("❌ Failed to update record.");
  }
};

const handleAgeCsvUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    skipEmptyLines: true,
    complete: async (results) => {
      const rows = results.data;
      console.log("RAW rows:", rows.slice(0, 6)); // Debug first rows

      // ✅ Row 2 = headers
      const headers = rows[2].map(h => (h || "").trim());
      const yearCols = headers.filter(h => /^\d{4}$/.test(h));

      const validAgeGroups = [
        "14 - Below",
        "15 - 19",
        "20 - 24",
        "25 - 29",
        "30 - 34",
        "35 - 39",
        "40 - 44",
        "45 - 49",
        "50 - 54",
        "55 - 59",
        "60 - 64",
        "65 - 69",
        "70 - Above",
      ];

      const cleaned = [];

      for (let i = 3; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;

        const ageGroup = normalizeAgeGroup(row[0]);

        // ✅ Only keep valid groups
        if (!validAgeGroups.includes(ageGroup)) continue;

        console.log("Processing Age Group:", ageGroup);

        yearCols.forEach((year) => {
          const colIndex = headers.indexOf(year);
          if (colIndex === -1 || !row[colIndex]) return;

          const countRaw = (row[colIndex] || "").trim();
          if (!countRaw) return;

          cleaned.push({
            year: Number(year),
            ageGroup, // ✅ normalized now
            count: parseInt(countRaw.replace(/,/g, "")) || 0,
          });
        });
      }

      console.log("✅ Parsed rows:", cleaned.length, cleaned.slice(0, 15));

      try {
        // 🚀 Save to Firestore
        await Promise.all(cleaned.map(record => addEmigrantByAge(record)));

        // ⚡ Update UI instantly
        setAgeData(prev => [...prev, ...cleaned]);

        alert("✅ Uploaded " + cleaned.length + " age records from CSV!");
      } catch (err) {
        console.error("Error saving age CSV:", err);
        alert("❌ Failed to upload Age CSV.");
      }
    },
  });
};


 
















// ================== EDUCATION CRUD ==================

// NEW: Handle CSV upload for education dataset
const handleEducationCsvUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const rows = await parseEducationCsv(file);
    await fetchEducation(); // refresh list from Firestore
    alert(`✅ Uploaded ${rows.length} education records from CSV!`);
  } catch (err) {
    console.error("Error parsing education CSV:", err);
    alert("❌ Failed to upload education CSV.");
  }
};

// Add new record
const handleEducationAdd = async () => {
  try {
    await addEducationRecord({
      year: Number(educationForm.year),
      elementary: Number(educationForm.elementary) || 0,
      highschool: Number(educationForm.highschool) || 0,
      college: Number(educationForm.college) || 0,
      postgrad: Number(educationForm.postgrad) || 0,
      notReported: Number(educationForm.notReported) || 0,
    });
    setEducationForm({
      year: "",
      elementary: "",
      highschool: "",
      college: "",
      postgrad: "",
      notReported: "",
    });
    await fetchEducation();
    alert("✅ Education record added!");
  } catch (err) {
    console.error("Error adding education record:", err);
    alert("❌ Failed to add education record.");
  }
};

const handleDeleteAllEmigrants = async () => {
  if (!window.confirm("⚠️ Delete ALL marital status records? This cannot be undone.")) return;
  try {
    await deleteAllEmigrants();
    await fetchData();
    alert("🗑️ All marital status records deleted!");
  } catch (err) {
    console.error("Error deleting emigrants:", err);
    alert("❌ Failed to delete all records.");
  }
};

const handleDeleteAllSex = async () => {
  if (!window.confirm("⚠️ Delete ALL male/female records? This cannot be undone.")) return;
  try {
    await deleteAllEmigrantsBySex();
    await fetchSexData();
    alert("🗑️ All sex records deleted!");
  } catch (err) {
    console.error("Error deleting sex records:", err);
    alert("❌ Failed to delete all records.");
  }
};


const handleDeleteAllEducation = async () => {
  if (!window.confirm("⚠️ Are you sure you want to delete ALL education records? This cannot be undone.")) {
    return;
  }
  try {
    await deleteAllEducationRecords();
    await fetchEducation();
    alert("🗑️ All education records deleted!");
  } catch (err) {
    console.error("Error deleting all records:", err);
    alert("❌ Failed to delete all records.");
  }
};

// Start editing
const startEducationEdit = (record) => {
  setEducationEditingId(record.id);
  setEducationEditForm(record);
};

// Cancel edit
const cancelEducationEdit = () => {
  setEducationEditingId(null);
  setEducationEditForm({
    year: "",
    elementary: "",
    highschool: "",
    college: "",
    postgrad: "",
    notReported: "",
  });
};

// Save edit
const saveEducationEdit = async (id) => {
  try {
    await updateEducationRecord(id, {
      year: Number(educationEditForm.year),
      elementary: Number(educationEditForm.elementary) || 0,
      highschool: Number(educationEditForm.highschool) || 0,
      college: Number(educationEditForm.college) || 0,
      postgrad: Number(educationEditForm.postgrad) || 0,
      notReported: Number(educationEditForm.notReported) || 0,
    });
    setEducationEditingId(null);
    await fetchEducation();
    alert("✅ Education record updated!");
  } catch (err) {
    console.error("Error updating education record:", err);
    alert("❌ Failed to update record.");
  }
};

// Delete record
const handleEducationDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this education record?")) return;
  try {
    await deleteEducationRecord(id);
    await fetchEducation();
    alert("🗑️ Education record deleted!");
  } catch (err) {
    console.error("Error deleting education record:", err);
    alert("❌ Failed to delete record.");
  }
};



  const handleComparisonCsvUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  parseComparisonCsv(file)
    .then((rows) => {
      const aggregated = aggregateByDecade(rows);
      setComparisonData(aggregated);
      alert("Comparison CSV uploaded and processed!");
    })
    .catch((err) => {
      console.error("Error parsing comparison CSV:", err);
    });
};


// ✅ Use a map so display labels match your actual data keys
const statusKeyMap = {
  "Single": "single",
  "Married": "married",
  "Widower": "widower",
  "Separated": "separated",
  "Divorced": "divorced",
  "Not Reported": "notReported", // correct camelCase key
};

const civilStatuses = Object.keys(statusKeyMap);

const heatmapYears = emigrants
  ? emigrants.map((e) => e.year).sort((a, b) => a - b)
  : [];

const heatmapData = civilStatuses.map((status) =>
  heatmapYears.map((year) => {
    const record = emigrants.find((e) => e.year === year);
    const key = statusKeyMap[status]; // map display label to field key
    return record ? record[key] || 0 : 0;
  })
);

const fetchEducation = async () => {
  try {
    const data = await getEducationRecords();
    const sorted = (data || []).sort((a, b) => a.year - b.year);
    setEducationData(sorted);
  } catch (err) {
    console.error("Error fetching education data:", err);
  }
};

useEffect(() => {
  fetchEducation();
}, []);


const fetchSexData = async () => {
  try {
    const data = await getEmigrantsBySex();
    // sort ascending by year
    const sorted = (data || []).sort((a, b) => a.year - b.year);
    setSexTrendData(sorted);
  } catch (err) {
    console.error("Error fetching sex-based emigrants:", err);
  }
};


useEffect(() => {
  fetchSexData();
}, []);

  // Fetch data
  const fetchData = async () => {
  try {
    setLoading(true);
    const data = await getEmigrants();
    // sort ascending by year
    const sorted = (data || []).sort((a, b) => a.year - b.year);
    setEmigrants(sorted);
  } catch (err) {
    console.error("Error fetching emigrants:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // Validation
  const validateForm = (formData, isEdit = false) => {
    const newErrors = {};
    if (!formData.year || formData.year < 1900 || formData.year > 2030) {
      newErrors.year = "Valid year is required (1900–2030)";
    }
    if (
      emigrants.some(
        (e) => e.year === Number(formData.year) && (!isEdit || e.id !== editingId)
      )
    ) {
      newErrors.year = "Year already exists";
    }
    ["single", "married", "widower", "separated", "divorced", "notReported"].forEach(
      (field) => {
        if (
          formData[field] &&
          (isNaN(formData[field]) || Number(formData[field]) < 0)
        ) {
          newErrors[field] = "Must be a valid positive number";
        }
      }
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleAdd = async () => {
  if (!validateForm(form)) return;
  try {
    await addEmigrant({
      ...form,
      year: Number(form.year),
      single: Number(form.single) || 0,
      married: Number(form.married) || 0,
      widower: Number(form.widower) || 0,
      separated: Number(form.separated) || 0,
      divorced: Number(form.divorced) || 0,
      notReported: Number(form.notReported) || 0,
    });
    setForm(initialForm);
    await fetchData();
    alert("✅ Record added successfully!");
  } catch (err) {
    console.error("Error adding emigrant:", err);
    alert("❌ Failed to add record. Please try again.");
  }
};

 // Delete
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await deleteEmigrant(id);
    await fetchData();
    alert("🗑️ Record deleted successfully!");
  } catch (err) {
    console.error("Error deleting emigrant:", err);
    alert("❌ Failed to delete record.");
  }
};

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm(record);
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

// Update
const saveEdit = async (id) => {
  if (!validateForm(editForm, true)) return;
  try {
    await updateEmigrant(id, {
      ...editForm,
      year: Number(editForm.year),
      single: Number(editForm.single) || 0,
      married: Number(editForm.married) || 0,
      widower: Number(editForm.widower) || 0,
      separated: Number(editForm.separated) || 0,
      divorced: Number(editForm.divorced) || 0,
      notReported: Number(editForm.notReported) || 0,
    });
    setEditingId(null);
    await fetchData();
    alert("✅ Record updated successfully!");
  } catch (err) {
    console.error("Error updating emigrant:", err);
    alert("❌ Failed to update record.");
  }
};

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialForm);
    setErrors({});
  };

  // Totals + chart data
  const totals = emigrants.reduce(
    (acc, cur) => ({
      single: acc.single + (cur.single || 0),
      married: acc.married + (cur.married || 0),
      widower: acc.widower + (cur.widower || 0),
      separated: acc.separated + (cur.separated || 0),
      divorced: acc.divorced + (cur.divorced || 0),
      notReported: acc.notReported + (cur.notReported || 0),
    }),
    { single: 0, married: 0, widower: 0, separated: 0, divorced: 0, notReported: 0 }
  );

  const totalEmigrants = Object.values(totals).reduce((sum, v) => sum + v, 0);

  const chartData = [
    { category: "Single", count: totals.single },
    { category: "Married", count: totals.married },
    { category: "Widower", count: totals.widower },
    { category: "Separated", count: totals.separated },
    { category: "Divorced", count: totals.divorced },
    { category: "Not Reported", count: totals.notReported },
  ];

  const trendData = emigrants
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((e) => ({
      year: e.year,
      total:
        e.single +
        e.married +
        e.widower +
        e.separated +
        e.divorced +
        e.notReported,
      single: e.single,
      married: e.married,
    }));

  const pieData = chartData.filter((item) => item.count > 0);

  // Add new male/female record
// Add new male/female record
const handleSexAdd = async () => {
  try {
    await addEmigrantBySex({
      year: Number(sexForm.year),
      male: Number(sexForm.male) || 0,
      female: Number(sexForm.female) || 0,
    });
    setSexForm({ year: "", male: "", female: "" });
    await fetchSexData();
    alert("✅ Record added successfully!"); // <-- Success prompt
  } catch (err) {
    console.error("Error adding sex record:", err);
    alert("❌ Failed to add record. Please try again.");
  }
};


// Delete male/female record
const handleSexDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await deleteEmigrantBySex(id);
    await fetchSexData();
    alert("🗑️ Record deleted successfully!");
  } catch (err) {
    console.error("Error deleting sex record:", err);
    alert("❌ Failed to delete record.");
  }
};

// Save edit male/female record
const saveSexEdit = async (id) => {
  try {
    await updateEmigrantBySex(id, {
      year: Number(sexEditForm.year),
      male: Number(sexEditForm.male) || 0,
      female: Number(sexEditForm.female) || 0,
    });
    setSexEditingId(null);
    await fetchSexData();
    alert("✅ Record updated successfully!");
  } catch (err) {
    console.error("Error updating sex record:", err);
    alert("❌ Failed to update record.");
  }
};

const startSexEdit = (record) => {
  setSexEditingId(record.id);
  setSexEditForm(record);
};

const cancelSexEdit = () => {
  setSexEditingId(null);
  setSexEditForm({ year: "", male: "", female: "" });
};


  // NEW: Handle CSV upload for sex trend
const handleSexCsvUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: async (results) => {
      const rows = results.data;
      const cleaned = rows
        .map((r) => ({
          YEAR: r[2],
          MALE: r[3],
          FEMALE: r[4],
        }))
        .filter((r) => /^\d+$/.test(r.YEAR))
        .map((r) => ({
          year: Number(r.YEAR),
          male: parseInt((r.MALE || "0").replace(/,/g, "")),
          female: parseInt((r.FEMALE || "0").replace(/,/g, "")),
        }))
        .filter((r) => r.year >= 1981 && r.year <= 2020);

      try {
        for (let row of cleaned) {
          await addEmigrantBySex(row);
        }
        await fetchSexData(); // reload from Firestore
        alert("CSV uploaded to emigrantsBySex collection!");
      } catch (err) {
        console.error("Error saving CSV data:", err);
      }
    },
  });
};
 
  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Header */}
 {/* ✅ Dynamic Hero Section */}
      <HeroSection
  emigrants={emigrants}
  emigrantsBySex={sexTrendData}
  educationData={educationData}   // ✅ added
  styles={styles}
/>



        {/* Dataset Selector */}
        <div style={styles.selectorCard}>
          <div style={styles.selectorHeader}>
            <Database size={20} />
            <span>Select Dataset</span>
          </div>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="dataset"
                value="emigrants"
                checked={activeDataset === "emigrants"}
                onChange={(e) => setActiveDataset(e.target.value)}
                style={styles.radioInput}
              />
              <span style={styles.radioCustom}></span>
              <FileText size={16} style={{ marginRight: '8px' }} />
              Marital Status (CRUD)
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="dataset"
                value="sex"
                checked={activeDataset === "sex"}
                onChange={(e) => setActiveDataset(e.target.value)}
                style={styles.radioInput}
              />
              <span style={styles.radioCustom}></span>
              <Users size={16} style={{ marginRight: '8px' }} />
              Sex(CRUD)
            </label>
            <label style={styles.radioLabel}>
            <input
              type="radio"
              name="dataset"
              value="education"
              checked={activeDataset === "education"}
              onChange={(e) => setActiveDataset(e.target.value)}
              style={styles.radioInput}
            />
            <span style={styles.radioCustom}></span>
            <Activity size={16} style={{ marginRight: '8px' }} />
            Education (CRUD)
          </label>
              <label style={styles.radioLabel}>
            <input
              type="radio"
              name="dataset"
              value="age"
              checked={activeDataset === "age"}
              onChange={(e) => setActiveDataset(e.target.value)}
              style={styles.radioInput}
            />
            <span style={styles.radioCustom}></span>
            <Users size={16} style={{ marginRight: "8px" }} />
            Age (CRUD)
          </label>

          </div>
        </div>

        {/* Add Form for Education Dataset */}
{activeDataset === "education" && (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <h2 style={styles.cardTitle}>
        <Plus size={20} /> Add New Education Record
      </h2>
      <div style={styles.cardSubtitle}>
        Enter emigrant data by educational attainment
      </div>
    </div>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Year</label>
        <input
          name="year"
          value={educationForm.year}
          onChange={(e) =>
            setEducationForm({ ...educationForm, year: e.target.value })
          }
          type="number"
          min="1980"
          max="2030"
          style={styles.input}
          placeholder="2020"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Elementary</label>
        <input
          name="elementary"
          value={educationForm.elementary}
          onChange={(e) =>
            setEducationForm({ ...educationForm, elementary: e.target.value })
          }
          type="number"
          min="0"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>High School</label>
        <input
          name="highschool"
          value={educationForm.highschool}
          onChange={(e) =>
            setEducationForm({ ...educationForm, highschool: e.target.value })
          }
          type="number"
          min="0"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>College</label>
        <input
          name="college"
          value={educationForm.college}
          onChange={(e) =>
            setEducationForm({ ...educationForm, college: e.target.value })
          }
          type="number"
          min="0"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Postgrad</label>
        <input
          name="postgrad"
          value={educationForm.postgrad}
          onChange={(e) =>
            setEducationForm({ ...educationForm, postgrad: e.target.value })
          }
          type="number"
          min="0"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Not Reported</label>
        <input
          name="notReported"
          value={educationForm.notReported}
          onChange={(e) =>
            setEducationForm({ ...educationForm, notReported: e.target.value })
          }
          type="number"
          min="0"
          style={styles.input}
        />
      </div>
    </div>

    <button style={styles.primaryButton} onClick={handleEducationAdd}>
      <Plus size={16} /> Add Record
    </button>
  </div>
)}



{/*add form for age dataset*/}
{activeDataset === "age" && (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <h2 style={styles.cardTitle}>
        <Plus size={20} /> Add New Age Record
      </h2>
      <div style={styles.cardSubtitle}>
        Enter emigrant data by age group
      </div>
    </div>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Year</label>
        <input
          type="number"
          min="1980"
          max="2030"
          value={ageForm.year}
          onChange={(e) =>
            setAgeForm({ ...ageForm, year: e.target.value })
          }
          style={styles.input}
          placeholder="2020"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Age Group</label>
        <input
          type="text"
          value={ageForm.ageGroup}
          onChange={(e) =>
            setAgeForm({ ...ageForm, ageGroup: e.target.value })
          }
          style={styles.input}
          placeholder="20-24"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Count</label>
        <input
          type="number"
          min="0"
          value={ageForm.count}
          onChange={(e) =>
            setAgeForm({ ...ageForm, count: e.target.value })
          }
          style={styles.input}
          placeholder="1000"
        />
      </div>
    </div>

    <button style={styles.primaryButton} onClick={handleAgeAdd}>
      <Plus size={16} /> Add Record
    </button>
  </div>
)}



        {/* Add Form for civil */}
        {activeDataset === "emigrants" && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Plus size={20} />
                Add New Record
              </h2>
              <div style={styles.cardSubtitle}>Enter emigrant data by marital status</div>
            </div>
            <div style={styles.formGrid}>
              {Object.keys(form).map((key) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>{fieldLabels[key]}</label>
                  <input
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    placeholder={key === "year" ? "2024" : "0"}
                    style={{
                      ...styles.input,
                      ...(errors[key] ? styles.inputError : {}),
                    }}
                  />
                  {errors[key] && (
                    <span style={styles.errorText}>
                      {errors[key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onClick={handleAdd}
              disabled={loading}
            >
              <Plus size={16} />
              {loading ? "Adding..." : "Add Record"}
            </button>
          </div>
        )}

        {/* Add Form for Sex Dataset */}
{activeDataset === "sex" && (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <h2 style={styles.cardTitle}>
        <Plus size={20} /> Add New Male/Female Record
      </h2>
      <div style={styles.cardSubtitle}>Enter emigrant data by sex</div>
    </div>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Year</label>
        <input
          name="year"
          value={sexForm.year}
          onChange={(e) => setSexForm({ ...sexForm, year: e.target.value })}
          type="number"
          min="1900"
          max="2030"
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Male</label>
        <input
          name="male"
          value={sexForm.male}
          onChange={(e) => setSexForm({ ...sexForm, male: e.target.value })}
          type="number"
          min="0"
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Female</label>
        <input
          name="female"
          value={sexForm.female}
          onChange={(e) => setSexForm({ ...sexForm, female: e.target.value })}
          type="number"
          min="0"
          style={styles.input}
        />
      </div>
    </div>

    <button style={styles.primaryButton} onClick={handleSexAdd}>
      <Plus size={16} /> Add Record
    </button>
  </div>
)}





    

{/* Records Table */}
{/* Records Table */}
<div style={styles.card}>
  <div
    style={{
      ...styles.cardHeader,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <h2 style={styles.cardTitle}>
      <BarChart3 size={20} />
      {activeDataset === "emigrants"
        ? "Records (Marital Status)"
        : activeDataset === "sex"
        ? "Records (Male vs Female)"
        : activeDataset === "education"
        ? "Records (Educational Attainment)"
        : "Records (Age Distribution)"}
    </h2>

    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {activeDataset === "emigrants" && (
        <button
          style={{ ...styles.primaryButton, background: "#EF4444" }}
          onClick={handleDeleteAllEmigrants}
        >
          🗑️ Delete All Records
        </button>
      )}
      {activeDataset === "sex" && (
        <button
          style={{ ...styles.primaryButton, background: "#EF4444" }}
          onClick={handleDeleteAllSex}
        >
          🗑️ Delete All Records
        </button>
      )}
      {activeDataset === "education" && (
        <button
          style={{ ...styles.primaryButton, background: "#EF4444" }}
          onClick={handleDeleteAllEducation}
        >
          🗑️ Delete All Records
        </button>
      )}
      {activeDataset === "age" && (
        <button
          style={{ ...styles.primaryButton, background: "#EF4444" }}
          onClick={handleDeleteAllAge}
        >
          🗑️ Delete All Records
        </button>
      )}

      {/* ✅ Dropdown filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ fontWeight: 600, color: "#374151" }}>Show:</label>
        <select
          value={recordsLimit}
          onChange={(e) => setRecordsLimit(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            fontSize: "14px",
          }}
        >
          <option value="all">All</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </div>
    </div>
  </div>

  {/* ================== EMIGRANTS ================== */}
  {activeDataset === "emigrants" ? (
    emigrants.length === 0 ? (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>
          <Users size={48} />
        </div>
        <h3 style={styles.emptyStateTitle}>No records found</h3>
        <p style={styles.emptyStateText}>
          Add your first record above or upload CSV to get started.
        </p>
      </div>
    ) : (
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Single</th>
              <th style={styles.th}>Married</th>
              <th style={styles.th}>Widower</th>
              <th style={styles.th}>Separated</th>
              <th style={styles.th}>Divorced</th>
              <th style={styles.th}>Not Reported</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>


<tbody>
  {(recordsLimit === "all"
    ? emigrants
    : emigrants.slice(0, Number(recordsLimit))
  ).map((row) => {
    const total =
      (row.single || 0) +
      (row.married || 0) +
      (row.widower || 0) +
      (row.separated || 0) +
      (row.divorced || 0) +
      (row.notReported || 0);

    return (
      <tr key={row.id} style={styles.tableRow}>
        {editingId === row.id ? (
          // INLINE EDITING MODE
          <>
            <td style={styles.td}>
              <input
                name="year"
                value={editForm.year}
                onChange={handleEditChange}
                type="number"
                min="1900"
                max="2030"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="single"
                value={editForm.single}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="married"
                value={editForm.married}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="widower"
                value={editForm.widower}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="separated"
                value={editForm.separated}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="divorced"
                value={editForm.divorced}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.td}>
              <input
                name="notReported"
                value={editForm.notReported}
                onChange={handleEditChange}
                type="number"
                min="0"
                style={styles.tableInput}
              />
            </td>
            <td style={styles.totalCell}>
              {(Number(editForm.single) || 0) +
               (Number(editForm.married) || 0) +
               (Number(editForm.widower) || 0) +
               (Number(editForm.separated) || 0) +
               (Number(editForm.divorced) || 0) +
               (Number(editForm.notReported) || 0)}
            </td>
            <td style={styles.td}>
              <button
                style={styles.actionButton}
                onClick={() => saveEdit(row.id)}
              >
                <Save size={16} color="#3B82F6" />
              </button>
              <button
                style={styles.actionButton}
                onClick={cancelEdit}
              >
                <X size={16} color="#EF4444" />
              </button>
            </td>
          </>
        ) : (
          // NORMAL DISPLAY MODE
          <>
            <td style={styles.td}>{row.year}</td>
            <td style={styles.td}>{row.single}</td>
            <td style={styles.td}>{row.married}</td>
            <td style={styles.td}>{row.widower}</td>
            <td style={styles.td}>{row.separated}</td>
            <td style={styles.td}>{row.divorced}</td>
            <td style={styles.td}>{row.notReported}</td>
            <td style={styles.totalCell}>{total}</td>
            <td style={styles.td}>
              <button style={styles.actionButton} onClick={() => startEdit(row)}>
                <Edit2 size={16} color="#3B82F6" />
              </button>
              <button style={styles.actionButton} onClick={() => handleDelete(row.id)}>
                <Trash2 size={16} color="#EF4444" />
              </button>
            </td>
          </>
        )}
      </tr>
    );
  })}
</tbody>
        </table>
        <p style={{ marginTop: "10px", color: "#6B7280", fontSize: "13px" }}>
          Showing{" "}
          {recordsLimit === "all"
            ? emigrants.length
            : Math.min(emigrants.length, Number(recordsLimit))}{" "}
          of {emigrants.length} records
        </p>
      </div>
    )
  ) : null}

 {/* ================== SEX ================== */}
{activeDataset === "sex" &&
  (sexTrendData.length === 0 ? (
    <div style={styles.emptyState}>
      <div style={styles.emptyStateIcon}>
        <Upload size={48} />
      </div>
      <h3 style={styles.emptyStateTitle}>No Male/Female records uploaded</h3>
      <p style={styles.emptyStateText}>Use the CSV upload below to import your data.</p>
    </div>
  ) : (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>Male</th>
            <th style={styles.th}>Female</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(recordsLimit === "all"
            ? sexTrendData
            : sexTrendData.slice(0, Number(recordsLimit))
          ).map((row) => {
            const total = (row.male || 0) + (row.female || 0);
            return (
              <tr key={row.id} style={styles.tableRow}>
                {sexEditingId === row.id ? (
                  // INLINE EDITING MODE
                  <>
                    <td style={styles.td}>
                      <input
                        name="year"
                        value={sexEditForm.year}
                        onChange={(e) =>
                          setSexEditForm({ ...sexEditForm, year: e.target.value })
                        }
                        type="number"
                        min="1900"
                        max="2030"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="male"
                        value={sexEditForm.male}
                        onChange={(e) =>
                          setSexEditForm({ ...sexEditForm, male: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="female"
                        value={sexEditForm.female}
                        onChange={(e) =>
                          setSexEditForm({ ...sexEditForm, female: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.totalCell}>
                      {(Number(sexEditForm.male) || 0) + (Number(sexEditForm.female) || 0)}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => saveSexEdit(row.id)}
                      >
                        <Save size={16} color="#3B82F6" />
                      </button>
                      <button
                        style={styles.actionButton}
                        onClick={cancelSexEdit}
                      >
                        <X size={16} color="#EF4444" />
                      </button>
                    </td>
                  </>
                ) : (
                  // NORMAL DISPLAY MODE
                  <>
                    <td style={styles.td}>{row.year}</td>
                    <td style={styles.td}>{row.male}</td>
                    <td style={styles.td}>{row.female}</td>
                    <td style={styles.totalCell}>{total}</td>
                    <td style={styles.td}>
                      <button style={styles.actionButton} onClick={() => startSexEdit(row)}>
                        <Edit2 size={16} color="#3B82F6" />
                      </button>
                      <button style={styles.actionButton} onClick={() => handleSexDelete(row.id)}>
                        <Trash2 size={16} color="#EF4444" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ marginTop: "10px", color: "#6B7280", fontSize: "13px" }}>
        Showing{" "}
        {recordsLimit === "all"
          ? sexTrendData.length
          : Math.min(sexTrendData.length, Number(recordsLimit))}{" "}
        of {sexTrendData.length} records
      </p>
    </div>
  ))}

{/* ================== EDUCATION ================== */}
{activeDataset === "education" &&
  (educationData.length === 0 ? (
    <div style={styles.emptyState}>
      <div style={styles.emptyStateIcon}>
        <Upload size={48} />
      </div>
      <h3 style={styles.emptyStateTitle}>No Education records found</h3>
      <p style={styles.emptyStateText}>
        Add your first record above or upload CSV to get started.
      </p>
    </div>
  ) : (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>Elementary</th>
            <th style={styles.th}>High School</th>
            <th style={styles.th}>College</th>
            <th style={styles.th}>Postgrad</th>
            <th style={styles.th}>Not Reported</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(recordsLimit === "all"
            ? educationData
            : educationData.slice(0, Number(recordsLimit))
          ).map((row) => {
            const total =
              (row.elementary || 0) +
              (row.highschool || 0) +
              (row.college || 0) +
              (row.postgrad || 0) +
              (row.notReported || 0);

            return (
              <tr key={row.id} style={styles.tableRow}>
                {educationEditingId === row.id ? (
                  // INLINE EDITING MODE
                  <>
                    <td style={styles.td}>
                      <input
                        name="year"
                        value={educationEditForm.year}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, year: e.target.value })
                        }
                        type="number"
                        min="1980"
                        max="2030"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="elementary"
                        value={educationEditForm.elementary}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, elementary: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="highschool"
                        value={educationEditForm.highschool}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, highschool: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="college"
                        value={educationEditForm.college}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, college: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="postgrad"
                        value={educationEditForm.postgrad}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, postgrad: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        name="notReported"
                        value={educationEditForm.notReported}
                        onChange={(e) =>
                          setEducationEditForm({ ...educationEditForm, notReported: e.target.value })
                        }
                        type="number"
                        min="0"
                        style={styles.tableInput}
                      />
                    </td>
                    <td style={styles.totalCell}>
                      {(Number(educationEditForm.elementary) || 0) +
                       (Number(educationEditForm.highschool) || 0) +
                       (Number(educationEditForm.college) || 0) +
                       (Number(educationEditForm.postgrad) || 0) +
                       (Number(educationEditForm.notReported) || 0)}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => saveEducationEdit(row.id)}
                      >
                        <Save size={16} color="#3B82F6" />
                      </button>
                      <button
                        style={styles.actionButton}
                        onClick={cancelEducationEdit}
                      >
                        <X size={16} color="#EF4444" />
                      </button>
                    </td>
                  </>
                ) : (
                  // NORMAL DISPLAY MODE
                  <>
                    <td style={styles.td}>{row.year}</td>
                    <td style={styles.td}>{row.elementary?.toLocaleString() || 0}</td>
                    <td style={styles.td}>{row.highschool?.toLocaleString() || 0}</td>
                    <td style={styles.td}>{row.college?.toLocaleString() || 0}</td>
                    <td style={styles.td}>{row.postgrad?.toLocaleString() || 0}</td>
                    <td style={styles.td}>{row.notReported?.toLocaleString() || 0}</td>
                    <td style={styles.totalCell}>{total.toLocaleString()}</td>
                    <td style={styles.td}>
                      <button style={styles.actionButton} onClick={() => startEducationEdit(row)}>
                        <Edit2 size={16} color="#3B82F6" />
                      </button>
                      <button style={styles.actionButton} onClick={() => handleEducationDelete(row.id)}>
                        <Trash2 size={16} color="#EF4444" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ marginTop: "10px", color: "#6B7280", fontSize: "13px" }}>
        Showing{" "}
        {recordsLimit === "all"
          ? educationData.length
          : Math.min(educationData.length, Number(recordsLimit))}{" "}
        of {educationData.length} records
      </p>
    </div>
  ))}


  {/* ================== AGE ================== */}
{/* ================== AGE ================== */}
{activeDataset === "age" &&
  (ageData.length === 0 ? (
    <div style={styles.emptyState}>
      <div style={styles.emptyStateIcon}>
        <Users size={48} />
      </div>
      <h3 style={styles.emptyStateTitle}>No Age records found</h3>
      <p style={styles.emptyStateText}>
        Add your first record above or upload CSV to get started.
      </p>
    </div>
  ) : (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>Age Group</th>
            <th style={styles.th}>Count</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(recordsLimit === "all"
            ? ageData
            : ageData.slice(0, Number(recordsLimit))
          ).map((row) => (
            <tr key={row.id} style={styles.tableRow}>
              {ageEditingId === row.id ? (
                // INLINE EDITING MODE
                <>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="1980"
                      max="2030"
                      value={ageEditForm.year}
                      onChange={(e) =>
                        setAgeEditForm({ ...ageEditForm, year: e.target.value })
                      }
                      style={styles.tableInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={ageEditForm.ageGroup}
                      onChange={(e) =>
                        setAgeEditForm({ ...ageEditForm, ageGroup: e.target.value })
                      }
                      style={styles.tableInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      value={ageEditForm.count}
                      onChange={(e) =>
                        setAgeEditForm({ ...ageEditForm, count: e.target.value })
                      }
                      style={styles.tableInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.actionButton}
                      onClick={() => saveAgeEdit(row.id)}
                    >
                      <Save size={16} color="#3B82F6" />
                    </button>
                    <button
                      style={styles.actionButton}
                      onClick={cancelAgeEdit}
                    >
                      <X size={16} color="#EF4444" />
                    </button>
                  </td>
                </>
              ) : (
                // NORMAL DISPLAY MODE
                <>
                  <td style={styles.td}>{row.year}</td>
                  <td style={styles.td}>{row.ageGroup}</td>
                  <td style={styles.td}>{row.count}</td>
                  <td style={styles.td}>
                    <button style={styles.actionButton} onClick={() => startAgeEdit(row)}>
                      <Edit2 size={16} color="#3B82F6" />
                    </button>
                    <button style={styles.actionButton} onClick={() => handleAgeDelete(row.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: "10px", color: "#6B7280", fontSize: "13px" }}>
        Showing{" "}
        {recordsLimit === "all"
          ? ageData.length
          : Math.min(ageData.length, Number(recordsLimit))}{" "}
        of {ageData.length} records
      </p>
    </div>
  ))}


</div>





{/* CSV Uploaders */}
 {activeDataset === "emigrants" && (
          <CsvUploaderCivil fetchData={fetchData} />
        )}

        {activeDataset === "age" && (
  <div style={styles.uploadCard}>
    <div style={styles.uploadHeader}>
      <Upload size={20} />
      <span>Upload Age CSV</span>
    </div>
    <input
      type="file"
      accept=".csv"
      onChange={handleAgeCsvUpload}
      style={styles.fileInput}
    />
  </div>
)}


{activeDataset === "sex" && (
  <div style={styles.uploadCard}>
    <div style={styles.uploadHeader}>
      <Upload size={20} />
      <span>Upload Sex CSV</span>
    </div>
    <input
      type="file"
      accept=".csv"
      onChange={handleSexCsvUpload}
      style={styles.fileInput}
    />
  </div>
)}

{activeDataset === "education" && (
  <div style={styles.uploadCard}>
    <div style={styles.uploadHeader}>
      <Upload size={20} />
      <span>Upload Education CSV</span>
    </div>
    <input
      type="file"
      accept=".csv"
      onChange={handleEducationCsvUpload}
      style={styles.fileInput}
    />
  </div>
)}






 {/* ✅ close this block */}





        {/* Visualization Selector */}
        <div style={styles.selectorCard}>
          <div style={styles.selectorHeader}>
            <BarChart3 size={20} />
            <span>Select Visualization [All Dataset]</span>
          </div>
          <div style={styles.visualizationGrid}>
            {[
              { value: "trends", label: "Trends", icon: TrendingUp },
              { value: "comparison", label: "Comparison", icon: BarChart3 },
              { value: "composition", label: "Composition", icon: Activity },
              { value: "distribution", label: "Distribution", icon: Users },
              { value: "relationships", label: "Relationships", icon: Globe },
              { value: "geographic", label: "Geographic", icon: Globe },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setActiveVisualization(value)}
                style={{
                  ...styles.vizButton,
                  ...(activeVisualization === value ? styles.vizButtonActive : {}),
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        {emigrants.length > 0 && (
          
          <div style={styles.chartCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Activity size={20} />
                Data Visualization
              </h2>
             {/* ✅ Dynamic description */}
<p style={{ fontSize: "0.9rem", color: "#4B5563", marginTop: "0.3rem" }}>
  {chartDescriptions[activeVisualization]}
</p>
</div>

{/* ✅ Dynamic Filters go here */}

{/* ✅ Filters for trends */}
{activeVisualization === "trends" && (
  <div style={styles.selectorCard}>
    <div style={styles.selectorHeader}>
      <Activity size={20} />
      <span>Filter Controls</span>
    </div>

    {/* Year Range with enhanced design */}
    <div style={{ marginBottom: "24px" }}>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center"
      }}>
        <Calendar size={16} style={{ marginRight: "8px" }} />
        Year Range
      </label>
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        alignItems: "center", 
        marginTop: "10px",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <input
          type="number"
          value={yearRange[0]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <span style={{ 
          color: "#64748b", 
          fontWeight: "600",
          fontSize: "14px"
        }}>
          to
        </span>
        <input
          type="number"
          value={yearRange[1]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <button 
          onClick={() => setYearRange([1980, 2020])}
          style={{
            padding: "12px 16px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            background: "white",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#2563eb";
            e.target.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.color = "#64748b";
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>

    {/* Sex with enhanced styling */}
    <div>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center"
      }}>
        <Users size={16} style={{ marginRight: "8px" }} />
        Sex
      </label>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: "8px", 
        marginTop: "10px" 
      }}>
        {["all", "male", "female"].map((sex) => {
          const isSelected = selectedSex === sex;
          return (
            <button
              key={sex}
              onClick={() => setSelectedSex(sex)}
              style={{
                padding: "12px 16px",
                border: isSelected ? "2px solid #2563eb" : "2px solid #e2e8f0",
                borderRadius: "10px",
                background: isSelected ? "#eff6ff" : "white",
                color: isSelected ? "#2563eb" : "#64748b",
                fontWeight: isSelected ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {sex.charAt(0).toUpperCase() + sex.slice(1)}
            </button>
          );
        })}
      </div>
    </div>

    {/* Selected indicator */}
    {selectedSex !== "all" && (
      <div style={{ 
        marginTop: "20px", 
        padding: "12px", 
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#64748b",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Filtered by
        </div>
        <span style={{
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "16px",
          fontSize: "13px",
          fontWeight: "500",
          boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
          display: "inline-block"
        }}>
          {selectedSex.charAt(0).toUpperCase() + selectedSex.slice(1)}
        </span>
      </div>
    )}
  </div>
)}

{/* ✅ Filters for Distribution */}
{activeVisualization === "distribution" && (
  <div style={styles.selectorCard}>
    <div style={styles.selectorHeader}>
      <Activity size={20} />
      <span>Filter Controls</span>
    </div>

    {/* Year Range */}
    <div style={{ marginBottom: "24px" }}>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center"
      }}>
        <Calendar size={16} style={{ marginRight: "8px" }} />
        Year Range
      </label>
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        alignItems: "center", 
        marginTop: "10px",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <input
          type="number"
          value={yearRange[0]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <span style={{ 
          color: "#64748b", 
          fontWeight: "600",
          fontSize: "14px"
        }}>
          to
        </span>
        <input
          type="number"
          value={yearRange[1]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <button 
          onClick={() => setYearRange([1980, 2020])}
          style={{
            padding: "12px 16px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            background: "white",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#2563eb";
            e.target.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.color = "#64748b";
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>

    {/* Toggle between single/multi with improved design */}
    <div style={{ marginBottom: "24px" }}>
      <label style={{ 
        fontWeight: "600", 
        marginBottom: "10px", 
        display: "block",
        fontSize: "14px",
        color: "#475569"
      }}>
        Selection Mode
      </label>
      <div style={{ 
        display: "flex", 
        gap: "0", 
        background: "#f1f5f9", 
        padding: "4px", 
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <button
          onClick={() => setMultiSelect(false)}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: !multiSelect ? "white" : "transparent",
            color: !multiSelect ? "#2563eb" : "#64748b",
            fontWeight: !multiSelect ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: !multiSelect ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          Single Select
        </button>
        <button
          onClick={() => setMultiSelect(true)}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: multiSelect ? "white" : "transparent",
            color: multiSelect ? "#2563eb" : "#64748b",
            fontWeight: multiSelect ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: multiSelect ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          Multi Select
        </button>
      </div>
    </div>

    {/* Age Groups with enhanced styling */}
    <div>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "block"
      }}>
        Age Groups
      </label>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", 
        gap: "8px", 
        marginTop: "10px" 
      }}>
        <button
          onClick={() => setSelectedAgeGroups([])}
          style={{
            padding: "12px 16px",
            border: selectedAgeGroups.length === 0 ? "2px solid #2563eb" : "2px solid #e2e8f0",
            borderRadius: "10px",
            background: selectedAgeGroups.length === 0 ? "#eff6ff" : "white",
            color: selectedAgeGroups.length === 0 ? "#2563eb" : "#64748b",
            fontWeight: selectedAgeGroups.length === 0 ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            gridColumn: "1 / -1"
          }}
        >
          All Age Groups
        </button>

        {ageOrder.map((group) => {
          const isSelected = selectedAgeGroups.includes(group);
          return (
            <button
              key={group}
              onClick={() => {
                if (multiSelect) {
                  setSelectedAgeGroups((prev) =>
                    prev.includes(group)
                      ? prev.filter((g) => g !== group)
                      : [...prev, group]
                  );
                } else {
                  setSelectedAgeGroups([group]);
                }
              }}
              style={{
                padding: "12px 16px",
                border: isSelected ? "2px solid #2563eb" : "2px solid #e2e8f0",
                borderRadius: "10px",
                background: isSelected ? "#eff6ff" : "white",
                color: isSelected ? "#2563eb" : "#64748b",
                fontWeight: isSelected ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {group}
            </button>
          );
        })}
      </div>
    </div>

    {/* Enhanced selected badges */}
    {selectedAgeGroups.length > 0 && (
      <div style={{ 
        marginTop: "20px", 
        padding: "12px", 
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#64748b",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Selected ({selectedAgeGroups.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {selectedAgeGroups.map((group) => (
            <span key={group} style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: "500",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
            }}>
              {group}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)}




{/* ✅ Filters for Composition */}
{activeVisualization === "composition" && (
  <div style={styles.selectorCard}>
    <div style={styles.selectorHeader}>
      <Activity size={20} />
      <span>Filter Controls</span>
    </div>

    {/* Year Range */}
    <div style={{ marginBottom: "24px" }}>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center"
      }}>
        <Calendar size={16} style={{ marginRight: "8px" }} />
        Year Range
      </label>
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        alignItems: "center", 
        marginTop: "10px",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <input
          type="number"
          value={yearRange[0]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <span style={{ 
          color: "#64748b", 
          fontWeight: "600",
          fontSize: "14px"
        }}>
          to
        </span>
        <input
          type="number"
          value={yearRange[1]}
          min="1980"
          max="2030"
          onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e293b",
            background: "white",
            outline: "none",
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "#2563eb"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <button 
          onClick={() => setYearRange([1980, 2020])}
          style={{
            padding: "12px 16px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            background: "white",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#2563eb";
            e.target.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.color = "#64748b";
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>

    {/* Toggle between single/multi with improved design */}
    <div style={{ marginBottom: "24px" }}>
      <label style={{ 
        fontWeight: "600", 
        marginBottom: "10px", 
        display: "block",
        fontSize: "14px",
        color: "#475569"
      }}>
        Selection Mode
      </label>
      <div style={{ 
        display: "flex", 
        gap: "0", 
        background: "#f1f5f9", 
        padding: "4px", 
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <button
          onClick={() => setMultiSelect(false)}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: !multiSelect ? "white" : "transparent",
            color: !multiSelect ? "#2563eb" : "#64748b",
            fontWeight: !multiSelect ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: !multiSelect ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          Single Select
        </button>
        <button
          onClick={() => setMultiSelect(true)}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: multiSelect ? "white" : "transparent",
            color: multiSelect ? "#2563eb" : "#64748b",
            fontWeight: multiSelect ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: multiSelect ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          Multi Select
        </button>
      </div>
    </div>

    {/* Education Levels with enhanced styling */}
    <div>
      <label style={{
        fontWeight: "600",
        fontSize: "14px",
        color: "#475569",
        marginBottom: "12px",
        display: "block"
      }}>
        Education Levels
      </label>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", 
        gap: "8px", 
        marginTop: "10px" 
      }}>
        <button
          onClick={() => setSelectedEducation([])}
          style={{
            padding: "12px 16px",
            border: selectedEducation.length === 0 ? "2px solid #2563eb" : "2px solid #e2e8f0",
            borderRadius: "10px",
            background: selectedEducation.length === 0 ? "#eff6ff" : "white",
            color: selectedEducation.length === 0 ? "#2563eb" : "#64748b",
            fontWeight: selectedEducation.length === 0 ? "600" : "500",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            gridColumn: "1 / -1"
          }}
        >
          All Levels
        </button>

        {[
          { value: "elementary", label: "Elementary" },
          { value: "highschool", label: "High School" },
          { value: "college", label: "College" },
          { value: "postgrad", label: "Postgrad" },
          { value: "notReported", label: "Not Reported" }
        ].map((edu) => {
          const isSelected = selectedEducation.includes(edu.value);
          return (
            <button
              key={edu.value}
              onClick={() => {
                if (multiSelect) {
                  setSelectedEducation((prev) =>
                    prev.includes(edu.value)
                      ? prev.filter((e) => e !== edu.value)
                      : [...prev, edu.value]
                  );
                } else {
                  setSelectedEducation([edu.value]);
                }
              }}
              style={{
                padding: "12px 16px",
                border: isSelected ? "2px solid #2563eb" : "2px solid #e2e8f0",
                borderRadius: "10px",
                background: isSelected ? "#eff6ff" : "white",
                color: isSelected ? "#2563eb" : "#64748b",
                fontWeight: isSelected ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {edu.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Enhanced selected badges */}
    {selectedEducation.length > 0 && (
      <div style={{ 
        marginTop: "20px", 
        padding: "12px", 
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#64748b",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Selected ({selectedEducation.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {selectedEducation.map((edu) => (
            <span key={edu} style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: "500",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
            }}>
              {edu}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)}





            <div style={styles.chartContainer}>
              {activeVisualization === "trends" && (
                sexTrendData.length === 0 ? (
                  <div style={styles.chartEmpty}>
                    <p>No Male/Female records available. Upload a CSV first.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                   <LineChart
  data={sexTrendData.filter(
    (row) => row.year >= yearRange[0] && row.year <= yearRange[1]
  )}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="year" />
  <YAxis />
  <Tooltip />
  <Legend />

  {(selectedSex === "all" || selectedSex === "male") && (
    <Line
      type="monotone"
      dataKey="male"
      stroke="#60A5FA"
      strokeWidth={3}
      name="Male"
    />
  )}

  {(selectedSex === "all" || selectedSex === "female") && (
    <Line
      type="monotone"
      dataKey="female"
      stroke="#CA8A04"
      strokeWidth={3}
      name="Female"
    />
  )}
</LineChart>

                  </ResponsiveContainer>
                )
              )}

          {activeVisualization === "comparison" && (
  <>
    {/* Upload Card */}
    <div style={styles.uploadCard}>
      <div style={styles.uploadHeader}>
        <Upload size={20} />
        <span>Upload Comparison CSV</span>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleComparisonCsvUpload}
        style={styles.fileInput}
      />
    </div>

    {/* Chart */}
    {comparisonData.length > 0 ? (
      <ComparisonChart data={comparisonData} />
    ) : (
      <div style={styles.chartEmpty}>
        <p>No comparison data available. Upload a CSV first.</p>
      </div>
    )}
  </>
)}



              {activeVisualization === "composition" && (
  educationData.length === 0 ? (
    <div style={styles.chartEmpty}>
      <p>No education data yet. Upload or add records first.</p>
    </div>
  ) : (
<ResponsiveContainer width="100%" height="100%">
<AreaChart
  data={educationData.filter(
    (row) => row.year >= yearRange[0] && row.year <= yearRange[1]
  )}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis
    dataKey="year"
    angle={-45}             // tilt labels
    textAnchor="end"
    interval={0}            // ✅ show ALL years
    height={80}             // enough space
    tick={{ fontSize: 11 }}
  />

  <YAxis />
  <Tooltip />
  <Legend />

  {/* 🎨 Conditional rendering based on selectedEducation */}
  {(selectedEducation.length === 0 || selectedEducation.includes("elementary")) && (
    <Area
      type="monotone"
      dataKey="elementary"
      stackId="1"
      stroke="#1E3A8A"
      fill="#1E3A8A"
    />
  )}

  {(selectedEducation.length === 0 || selectedEducation.includes("highschool")) && (
    <Area
      type="monotone"
      dataKey="highschool"
      stackId="1"
      stroke="#F59E0B"
      fill="#F59E0B"
    />
  )}

  {(selectedEducation.length === 0 || selectedEducation.includes("college")) && (
    <Area
      type="monotone"
      dataKey="college"
      stackId="1"
      stroke="#2563EB"
      fill="#2563EB"
    />
  )}

  {(selectedEducation.length === 0 || selectedEducation.includes("postgrad")) && (
    <Area
      type="monotone"
      dataKey="postgrad"
      stackId="1"
      stroke="#D97706"
      fill="#D97706"
    />
  )}

  {(selectedEducation.length === 0 || selectedEducation.includes("notReported")) && (
    <Area
      type="monotone"
      dataKey="notReported"
      stackId="1"
      stroke="#FCD34D"
      fill="#FCD34D"
    />
  )}
</AreaChart>

</ResponsiveContainer>



  )
)}


{activeVisualization === "distribution" && (
  ageData.length === 0 ? (
    <div style={styles.chartEmpty}>
      <p>No Age data available. Upload a CSV first.</p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
  data={aggregateAgeByDecade(
    ageData.filter(
      (row) =>
        row.year >= yearRange[0] &&
        row.year <= yearRange[1] &&
        (selectedAgeGroups.length === 0 || selectedAgeGroups.includes(row.ageGroup))
    )
  )}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="ageGroup" />
  <YAxis />
  <Tooltip />
  <Legend />

  {/** ✅ Auto-generate bars for all decades (filtered) */}
  {Array.from(
    new Set(
      ageData
        .filter(
          (row) =>
            row.year >= yearRange[0] &&
            row.year <= yearRange[1] &&
            (selectedAgeGroups.length === 0 || selectedAgeGroups.includes(row.ageGroup))
        )
        .map((row) => getDecade(row.year))
    )
  )
    .sort() // ensure 1980s, 1990s, …, 2020s order
    .map((decade, idx) => (
      <Bar
        key={decade}
        dataKey={decade}
        fill={["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#6366F1", "#EC4899"][idx % 6]}
      />
    ))}
</BarChart>

    </ResponsiveContainer>
  )
)}





              {activeVisualization === "relationships" && (
                heatmapYears.length === 0 ? (
                  <div style={styles.chartEmpty}>
                    <p>No civil status data available. Upload the Civil Status CSV first.</p>
                  </div>
                ) : (
<div style={styles.heatmapContainer}>
  <h3 style={styles.heatmapTitle}>Marital Status × Year Heatmap</h3>
  <div style={{ display: "flex" }}>
    
    {/* Fixed Y-axis labels */}
    <div style={styles.yAxisLabels}>
      {civilStatuses.map((status, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            ...styles.yAxisLabel,
            background:
              hoverRow === rowIdx ? "rgba(59,130,246,0.15)" : "transparent",
          }}
        >
          {status}
        </div>
      ))}
    </div>

    {/* Scrollable Heatmap */}
    <div style={styles.heatmapWrapper}>
      <div style={styles.heatmapScroll}>
        <HeatMap
          xLabels={heatmapYears.map(String)}
          yLabels={new Array(civilStatuses.length).fill("")}
          data={heatmapData}
          squares
          height={45}
          cellStyle={(background, value, min, max, data, x, y) => {
            // ✅ Logarithmic scaling
            const flatVals = data.flat().filter((v) => v > 0);
            const globalMax = Math.max(...flatVals);
            const intensity =
              value > 0
                ? Math.log(value + 1) / Math.log(globalMax + 1)
                : 0;

            const isRowHighlight = hoverRow === y;
            const isColHighlight = hoverCol === x;

            return {
              background: `hsl(210,70%,${95 - intensity * 50}%)`,
              fontSize: "11px",
              fontWeight: "500",
              color: intensity > 0.6 ? "white" : "#111827",
              border: "1px solid #E5E7EB",
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 0.2s ease",
              outline:
                isRowHighlight || isColHighlight
                  ? "2px solid #2563EB"
                  : "none",
              outlineOffset: "-2px",
            };
          }}
          cellRender={(value, x, y) => (
            <div
              onMouseEnter={() => {
                setHoverRow(y);
                setHoverCol(x);
              }}
              onMouseLeave={() => {
                setHoverRow(null);
                setHoverCol(null);
              }}
            >
              {value > 0 ? value.toLocaleString() : ""}
            </div>
          )}
        />
      </div>
    </div>
  </div>
</div>



                )
              )}

     {activeVisualization === "geographic" && (
  <FlowMapUploader />
)}


            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

// =================== ENHANCED STYLES ===================
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  
  maxWidth: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  // Enhanced Hero Section with Glass Morphism
  heroCard: {
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    borderRadius: "32px",
    overflow: "hidden",
    marginBottom: "32px",
    boxShadow: `
      0 32px 64px -12px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.8)
    `,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  heroOverlay: {
    background: `
      linear-gradient(135deg, 
        rgba(99, 102, 241, 0.08) 0%, 
        rgba(139, 92, 246, 0.06) 50%,
        rgba(59, 130, 246, 0.08) 100%
      )
    `,
    padding: "56px",
    position: "relative",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "40px",
  },

  heroText: {
    flex: "1",
    minWidth: "320px",
  },

  heroTitle: {
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: "900",
    color: "#0F172A",
    margin: "0 0 20px 0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
  },

  heroSubtitle: {
    color: "#475569",
    fontSize: "clamp(16px, 3vw, 20px)",
    margin: 0,
    lineHeight: "1.6",
    fontWeight: "500",
    maxWidth: "600px",
  },

  // Enhanced Stats Grid with Micro-animations
statsGrid: {
  display: "flex",
  gap: "24px",
  flexWrap: "wrap",       // ✅ allows wrapping on smaller screens
  alignItems: "stretch",
  justifyContent: "flex-start", // or "center" or "space-between"
},



statCard: {
  background: "rgba(255, 255, 255, 0.4)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "20px",
  padding: "28px",
  display: "flex",
  flexDirection: "column", // stack icon + content
  alignItems: "center",     // center everything
  textAlign: "center",
  gap: "16px",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6)
  `,
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  transform: "translateY(0)",
},


statIcon: {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontSize: "22px",
  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
},


statContent: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center", // center number + label
},


  statNumber: {
    fontSize: "clamp(20px, 4vw, 28px)",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 6px 0",
    lineHeight: "1",
  },

  statLabel: {
    fontSize: "12px",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: "600",
    margin: 0,
  },

  // Enhanced Card Styles
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "24px",
    boxShadow: `
      0 20px 40px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.9)
    `,
    padding: "36px",
    marginBottom: "28px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },

  selectorCard: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "24px",
    boxShadow: `
      0 16px 32px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(255, 255, 255, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.8)
    `,
    padding: "28px",
    marginBottom: "28px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },

  selectorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: "24px",
  },

  // Enhanced Radio Groups
  radioGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },

  radioLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    padding: "16px 24px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "15px",
    fontWeight: "600",
    color: "#475569",
    position: "relative",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    transform: "translateY(0)",
  },

  radioInput: {
    display: "none",
  },

  radioCustom: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #CBD5E1",
    marginRight: "14px",
    position: "relative",
    transition: "all 0.3s ease",
    background: "white",
    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
  },

  cardHeader: {
    marginBottom: "32px",
    position: "relative",
  },

  cardTitle: {
    fontSize: "clamp(20px, 4vw, 26px)",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 10px 0",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    lineHeight: "1.3",
  },

  cardSubtitle: {
    color: "#64748B",
    fontSize: "15px",
    margin: 0,
    fontWeight: "500",
    lineHeight: "1.5",
  },

  // Enhanced Form Styles
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: "10px",
    textTransform: "capitalize",
    letterSpacing: "0.3px",
  },

  input: {
    padding: "16px 20px",
    border: "2px solid rgba(203, 213, 225, 0.6)",
    borderRadius: "14px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    fontWeight: "500",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    "&:focus": {
      borderColor: "#3B82F6",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
      transform: "translateY(-1px)",
    }
  },

  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.1)",
  },

  errorText: {
    fontSize: "12px",
    color: "#EF4444",
    marginTop: "8px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  // Enhanced Button Styles
  primaryButton: {
    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    color: "white",
    padding: "18px 28px",
    border: "none",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: `
      0 8px 24px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2)
    `,
    alignSelf: "flex-start",
    position: "relative",
    overflow: "hidden",
    transform: "translateY(0)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `
        0 12px 32px rgba(59, 130, 246, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3)
      `,
    },
    "&:active": {
      transform: "translateY(0)",
    }
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none !important",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },

  // Enhanced Table Styles
  tableContainer: {
    overflowX: "auto",
    borderRadius: "20px",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  th: {
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    backdropFilter: "blur(8px)",
    padding: "20px 18px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "800",
    color: "#1E293B",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    borderBottom: "2px solid rgba(226, 232, 240, 0.8)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  td: {
    padding: "18px",
    borderBottom: "1px solid rgba(241, 245, 249, 0.8)",
    color: "#475569",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },

  tableRow: {
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    }
  },

  totalCell: {
    padding: "18px",
    borderBottom: "1px solid rgba(241, 245, 249, 0.8)",
    fontWeight: "800",
    color: "#3B82F6",
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
    backdropFilter: "blur(8px)",
    position: "relative",
  },

  actionButton: {
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    cursor: "pointer",
    padding: "10px",
    borderRadius: "10px",
    marginRight: "6px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
    }
  },

  tableInput: {
    width: "100px",
    padding: "10px 14px",
    border: "2px solid rgba(203, 213, 225, 0.6)",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
    "&:focus": {
      borderColor: "#3B82F6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    }
  },

  // Enhanced Empty States
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#64748B",
  },

  emptyStateIcon: {
    margin: "0 auto 24px",
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(226, 232, 240, 0.6) 0%, rgba(241, 245, 249, 0.8) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94A3B8",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },

  emptyStateTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1E293B",
    margin: "0 0 16px 0",
  },

  emptyStateText: {
    fontSize: "15px",
    color: "#64748B",
    margin: 0,
    maxWidth: "400px",
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: "1.6",
  },

  // Enhanced Upload Card
  uploadCard: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "24px",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.06)",
    padding: "32px",
    marginBottom: "28px",
    border: "2px dashed rgba(99, 102, 241, 0.3)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      borderColor: "rgba(99, 102, 241, 0.5)",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      transform: "translateY(-2px)",
    }
  },

  uploadHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: "20px",
  },

  fileInput: {
    width: "100%",
    padding: "20px",
    border: "2px solid rgba(203, 213, 225, 0.6)",
    borderRadius: "16px",
    fontSize: "15px",
    cursor: "pointer",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontWeight: "500",
    color: "#475569",
    "&:hover": {
      borderColor: "#3B82F6",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
    }
  },

  // Enhanced Visualization Grid
  visualizationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  vizButton: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px 24px",
    background: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(16px)",
    border: "2px solid rgba(226, 232, 240, 0.6)",
    borderRadius: "18px",
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "15px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    transform: "translateY(0)",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.08)",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    }
  },

  vizButtonActive: {
    background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    color: "white",
    borderColor: "transparent",
    boxShadow: `
      0 12px 32px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2)
    `,
    transform: "translateY(-4px)",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: `
        0 16px 40px rgba(59, 130, 246, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3)
      `,
    }
  },

  // Enhanced Chart Styles
  chartCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: "28px",
    boxShadow: `
      0 24px 48px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.9)
    `,
    padding: "40px",
    marginBottom: "32px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    position: "relative",
    overflow: "hidden",
  },

  chartContainer: {
    height: "520px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    padding: "28px",
    overflow: "hidden",
    position: "relative",
  },

  chartEmpty: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748B",
    fontSize: "16px",
    fontWeight: "600",
    gap: "12px",
  },

  // Enhanced Heatmap Styles
  heatmapContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },

  heatmapTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: "32px",
    textAlign: "center",
    background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  yAxisLabels: {
    minWidth: "140px",
    textAlign: "right",
    paddingRight: "16px",
    fontWeight: 700,
    color: "#1E293B",
  },

  yAxisLabel: {
    height: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },

  heatmapWrapper: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: "8px",
  },

  heatmapScroll: {
    display: "inline-block",
    minWidth: "max-content",
  },

  // Responsive breakpoints
  "@media (max-width: 768px)": {
    heroOverlay: {
      padding: "32px 24px",
    },
    heroContent: {
      flexDirection: "column",
      gap: "24px",
    },
    statsGrid: {
      gridTemplateColumns: "1fr",
    },
    radioGroup: {
      gridTemplateColumns: "1fr",
    },
    visualizationGrid: {
      gridTemplateColumns: "1fr",
    },
    formGrid: {
      gridTemplateColumns: "1fr",
    }
  },

  "@media (max-width: 480px)": {
    container: {
      padding: "16px",
    },
    card: {
      padding: "24px",
    },
    heroOverlay: {
      padding: "24px",
    }
  }
};

