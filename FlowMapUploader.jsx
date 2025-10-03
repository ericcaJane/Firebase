import React, { useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import * as d3 from "d3";
import { Tooltip as ReactTooltip } from "react-tooltip";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const originCoords = {
  Philippines: [122, 13],
};

const countryCoords = {
  // Major destinations
  "UNITED STATES OF AMERICA": [-97, 38],
  "UNITED STATES": [-97, 38],
  "USA": [-97, 38],
  CANADA: [-106, 56],
  AUSTRALIA: [133, -25],
  JAPAN: [138, 36],
  ITALY: [12, 42],
  "UNITED KINGDOM": [-1, 54],
  "UK": [-1, 54],
  GERMANY: [10, 51],
  "SOUTH KOREA": [127.5, 36],
  "KOREA": [127.5, 36],
  "NEW ZEALAND": [174, -41],
  FRANCE: [2, 46],
  SPAIN: [0, 40],
  NETHERLANDS: [5, 52],
  SWEDEN: [15, 62],
  NORWAY: [10, 60],
  DENMARK: [10, 56],
  SWITZERLAND: [8, 47],
  AUSTRIA: [14, 47],
  BELGIUM: [4, 50],
  FINLAND: [26, 64],
  IRELAND: [-8, 53],
  PORTUGAL: [-8, 39],
  GREECE: [22, 39],
  POLAND: [20, 52],
  CZECH: [15, 50],
  HUNGARY: [20, 47],
  ROMANIA: [25, 46],
  BULGARIA: [25, 43],
  CROATIA: [16, 45],
  SLOVENIA: [15, 46],
  SLOVAKIA: [20, 49],
  ESTONIA: [26, 59],
  LATVIA: [25, 57],
  LITHUANIA: [24, 56],
  LUXEMBOURG: [6, 50],
  MALTA: [14, 36],
  CYPRUS: [33, 35],
  ICELAND: [-18, 65],
  TURKEY: [35, 39],
  RUSSIA: [38, 64],
  UKRAINE: [32, 49],
  BELARUS: [28, 54],
  MOLDOVA: [29, 47],
  GEORGIA: [43, 42],
  ARMENIA: [45, 40],
  AZERBAIJAN: [48, 40],
  KAZAKHSTAN: [68, 48],
  UZBEKISTAN: [64, 42],
  KYRGYZSTAN: [75, 41],
  TAJIKISTAN: [71, 39],
  TURKMENISTAN: [60, 40],
  AFGHANISTAN: [67, 33],
  PAKISTAN: [70, 30],
  INDIA: [78, 22],
  BANGLADESH: [90, 24],
  "SRI LANKA": [81, 7],
  MYANMAR: [96, 22],
  THAILAND: [101, 15],
  VIETNAM: [106, 16],
  CAMBODIA: [105, 13],
  LAOS: [102, 18],
  MALAYSIA: [102, 3],
  SINGAPORE: [104, 1],
  INDONESIA: [118, -5],
  BRUNEI: [115, 5],
  CHINA: [104, 35],
  TAIWAN: [121, 24],
  "HONG KONG": [114, 22],
  MONGOLIA: [103, 46],
  "NORTH KOREA": [127, 40],
  ISRAEL: [35, 31],
  JORDAN: [36, 31],
  LEBANON: [36, 34],
  SYRIA: [39, 35],
  IRAQ: [44, 33],
  IRAN: [53, 32],
  "SAUDI ARABIA": [45, 24],
  YEMEN: [48, 15],
  OMAN: [56, 21],
  UAE: [54, 24],
  QATAR: [51, 25],
  BAHRAIN: [51, 26],
  KUWAIT: [48, 29],
  EGYPT: [30, 26],
  SUDAN: [30, 15],
  LIBYA: [17, 25],
  TUNISIA: [9, 34],
  ALGERIA: [3, 28],
  MOROCCO: [-7, 32],
  ETHIOPIA: [40, 8],
  KENYA: [38, 1],
  UGANDA: [32, 1],
  TANZANIA: [35, -6],
  "SOUTH AFRICA": [24, -29],
  NIGERIA: [8, 10],
  GHANA: [-2, 8],
  "IVORY COAST": [-5, 8],
  SENEGAL: [-14, 14],
  MALI: [-4, 17],
  "BURKINA FASO": [-2, 13],
  NIGER: [8, 16],
  CHAD: [19, 15],
  CAMEROON: [12, 6],
  GABON: [12, -1],
  "CONGO": [15, -1],
  "DEMOCRATIC REPUBLIC OF CONGO": [22, -3],
  ANGOLA: [18, -13],
  ZAMBIA: [28, -15],
  ZIMBABWE: [30, -20],
  BOTSWANA: [24, -22],
  NAMIBIA: [17, -22],
  MADAGASCAR: [47, -19],
  MAURITIUS: [57, -20],
  BRAZIL: [-55, -10],
  ARGENTINA: [-64, -34],
  CHILE: [-71, -30],
  URUGUAY: [-56, -33],
  PARAGUAY: [-58, -23],
  BOLIVIA: [-65, -17],
  PERU: [-76, -10],
  ECUADOR: [-79, -2],
  COLOMBIA: [-74, 4],
  VENEZUELA: [-67, 8],
  GUYANA: [-59, 5],
  SURINAME: [-56, 4],
  MEXICO: [-102, 23],
  GUATEMALA: [-91, 15],
  BELIZE: [-89, 17],
  "EL SALVADOR": [-89, 14],
  HONDURAS: [-87, 14],
  NICARAGUA: [-85, 13],
  "COSTA RICA": [-84, 10],
  PANAMA: [-80, 9],
  CUBA: [-80, 22],
  JAMAICA: [-77, 18],
  HAITI: [-72, 19],
  "DOMINICAN REPUBLIC": [-71, 19],
  "PUERTO RICO": [-66, 18],
  "TRINIDAD AND TOBAGO": [-61, 11],
  
  // All missing countries from the list
  ALBANIA: [20, 41],
  ANDORRA: [1.5, 43],
  ANGUILLA: [-63, 18],
  "ANTIGUA AND BARBUDA": [-62, 17],
  ARUBA: [-70, 12],
  BAHAMAS: [-78, 24],
  BERMUDA: [-65, 32],
  "BOSNIA AND HERZEGOVINA": [18, 44],
  "BRITISH VIRGIN ISLANDS": [-65, 18],
  "BRUNEI DARUSSALAM": [115, 5],
  "CAYMAN ISLANDS": [-81, 19],
  "CHANNEL ISLAND": [-2, 49],
  "CHINA (P.R.O.C.)": [104, 35],
  "COCOS (KEELING) ISLAND": [97, -12],
  "CZECH REPUBLIC": [15, 50],
  "DEMOCRATIC KAMPUCHEA": [105, 13],
  "DEMOCRATIC REPUBLIC OF THE CONGO (ZAIRE)": [22, -3],
  "FAROE ISLANDS": [-7, 62],
  "FALKLAND ISLANDS (MALVINAS)": [-59, -52],
  FIJI: [178, -18],
  "FRENCH POLYNESIA": [-149, -17],
  GIBRALTAR: [-5, 36],
  GREENLAND: [-42, 72],
  HONGKONG: [114, 22],
  "ISLE OF MAN": [-5, 54],
  KIRIBATI: [173, 1],
  LEICHTENSTEIN: [9, 47],
  LESOTHO: [28, -29],
  LIBERIA: [-10, 6],
  MACAU: [113, 22],
  MACEDONIA: [22, 42],
  MALDIVES: [73, 3],
  "MARSHALL ISLANDS": [169, 7],
  "MIDWAY ISLAND": [-177, 28],
  MONACO: [7, 44],
  "MYANMAR (BURMA)": [96, 22],
  NEPAL: [84, 28],
  "NETHERLANDS ANTILLES": [-69, 12],
  "NEW CALEDONIA": [165, -21],
  "PACIFIC ISLANDS": [158, 7],
  PALAU: [134, 7],
  "PAPUA NEW GUINEA": [144, -6],
  "RUSSIAN FEDERATION / USSR": [38, 64],
  "SAN MARINO": [12, 44],
  SEYCHELLES: [55, -5],
  "SLOVAK REPUBLIC": [20, 49],
  "SOLOMON ISLANDS": [160, -9],
  "TAIWAN (ROC)": [121, 24],
  "TURKS AND CAICOS ISLANDS": [-72, 21],
  "UNITED ARAB EMIRATES": [54, 24],
  VANUATU: [167, -16],
  "WAKE ISLAND": [167, 19],
  "YUGOSLAVIA (Serbia & Montenegro)": [21, 44]
};  

const aliases = {
  "UNITED STATES": "USA",
  "UNITED STATES OF AMERICA": "USA",
  "RUSSIAN FEDERATION": "RUSSIA",
  "KOREA, REPUBLIC OF": "SOUTH KOREA",
  "KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF": "NORTH KOREA",
  "IRAN, ISLAMIC REPUBLIC OF": "IRAN",
  "VIET NAM": "VIETNAM",
  "CZECH REPUBLIC": "CZECH",
  // add more as you notice mismatches
};

const FlowMapUploader = () => {
  const [flows, setFlows] = useState([]);
  const [filter, setFilter] = useState("top10");
  const [zoom, setZoom] = useState(1);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        let rows = results.data;

        rows = rows.slice(2); // skip title + blank row
        const headers = rows[0].map((h) => (h || "").trim());
        const dataRows = rows.slice(1);

        const cleaned = dataRows.map((row) => {
          const obj = {};
          headers.forEach((h, i) => {
            if (h) obj[h] = row[i];
          });
          return obj;
        });

        const flows = cleaned
          .map((row) => {
            const country = row["COUNTRY"]?.trim();
            const total = parseInt(
              (row["TOTAL"] || "0").toString().replace(/,/g, ""),
              10
            );
            if (!country || country === "GRAND TOTAL" || isNaN(total) || total === 0) return null;
            return { from: "Philippines", to: country, count: total };
          })
          .filter(Boolean);

        setFlows(flows);
      },
    });
  };

  const getFilteredFlows = () => {
    if (!flows.length) return [];
    const sorted = [...flows].sort((a, b) => b.count - a.count);

    if (filter === "top5") return sorted.slice(0, 5);
    if (filter === "top10") return sorted.slice(0, 10);
    if (filter === "top20") return sorted.slice(0, 20);
    return sorted.filter((f) => countryCoords[f.to]);
  };

  const filteredFlows = getFilteredFlows();

  const scale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredFlows, (d) => d.count) || 1])
    .range([1, 8]);

  return (
    <div>
      <h3>📂 Upload Emigrant CSV for Flow Map</h3>
      <input type="file" accept=".csv" onChange={handleUpload} />

      {/* Dropdown filter */}
   <div style={{ margin: "10px 0", display: "flex", gap: "10px" }}>
  <select
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
    style={{
      padding: "6px 10px",
      borderRadius: "6px",
      border: "1px solid #D1D5DB",
      fontSize: "14px",
    }}
  >
    <option value="top5">Top 5</option>
    <option value="top10">Top 10</option>
    <option value="top20">Top 20</option>
    <option value="all">All</option>
  </select>

  <button style={btnStyle} onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}>➕ Zoom In</button>
  <button style={btnStyle} onClick={() => setZoom((z) => Math.max(z / 1.5, 0.8))}>➖ Zoom Out</button>
  <button style={btnStyle} onClick={() => setZoom(1)}>🔄 Reset</button>
</div>



      <div style={{ width: "100%", height: "600px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 200, center: [0, 0] }}
          width={1400}
          height={600}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={zoom} center={[0, 20]}>
      <Geographies geography={geoUrl}>
  {({ geographies }) =>
    geographies.map((geo) => {
      let countryName = (geo.properties.NAME || "").toUpperCase();

      // Normalize with aliases
      if (aliases[countryName]) {
        countryName = aliases[countryName];
      }

      // Try to find flow
      const flow = flows.find((f) => f.to.toUpperCase() === countryName);

      return (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={flow ? "#BFDBFE" : "#F3F4F6"}
          stroke="#D1D5DB"
          strokeWidth={0.5}
          data-tooltip-id="flowTip"
          data-tooltip-content={
            flow
              ? `${flow.to}: ${flow.count.toLocaleString()} emigrants`
              : countryName
          }
          style={{
            default: { outline: "none" },
            hover: { fill: "#93C5FD", outline: "none" },
            pressed: { fill: "#3B82F6", outline: "none" },
          }}
        />
      );
    })
  }
</Geographies>



{/* Origin marker */}
{Object.entries(originCoords).map(([name, coords]) => (
  <Marker key={name} coordinates={coords}>
    <circle
      r={8}
      fill="#DC2626"
      stroke="#FFF"
      strokeWidth={2}
      style={{ filter: "drop-shadow(0 0 4px rgba(220,38,38,0.6))" }}
      data-tooltip-id="flowTip"
      data-tooltip-content={`Origin: ${name}`}
    />
    <text
      textAnchor="middle"
      y={-12}
      style={{
        fontFamily: "system-ui",
        fill: "#B91C1C",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      {name}
    </text>
  </Marker>
))}

{/* Destination markers */}
{filteredFlows
  .filter((f) => countryCoords[f.to])
  .map((f, i) => (
    <Marker key={f.to} coordinates={countryCoords[f.to]}>
      <circle
        r={Math.max(3, scale(f.count))} // proportional size
        fill="#2563EB"
        stroke="#FFF"
        strokeWidth={1}
        opacity={0.9}
        data-tooltip-id="flowTip"
        data-tooltip-content={`${f.to}: ${d3.format(",")(f.count)} emigrants`}
      />
      {i < 10 && ( // only label top 10
        <text
          textAnchor="middle"
          y={-10}
          style={{
            fontFamily: "system-ui",
            fill: "#1E3A8A",
            fontSize: 10,
            fontWeight: "500",
          }}
        >
          {f.to.length > 12 ? f.to.substring(0, 12) + "..." : f.to}
        </text>
      )}
    </Marker>
  ))}

            {/* Flow lines */}
            {filteredFlows.map((f, i) => {
              const from = originCoords[f.from];
              const toCoords = countryCoords[f.to];
              if (!from || !toCoords) return null;

              return (
                <Line
                  key={i}
                  from={from}
                  to={toCoords}
                  stroke="#EF4444"
                  strokeWidth={scale(f.count)}
                  strokeOpacity={0.7}
                  data-tooltip-id="flowTip"
                  data-tooltip-content={`${f.to}: ${f.count.toLocaleString()} emigrants`}
                />
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      <ReactTooltip id="flowTip" />
    </div>
  );
};

export default FlowMapUploader;
const btnStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  background: "#2563EB",
  color: "#FFF",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
};