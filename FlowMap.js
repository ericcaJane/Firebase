import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import * as d3 from "d3";

// World topojson (react-simple-maps has a default one)
const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

// Coordinates (lat, lng) of Philippines + top 5 destinations
const locations = {
  Philippines: [121.774, 12.8797],
  US: [-95.7129, 37.0902],
  Canada: [-106.3468, 56.1304],
  Australia: [133.7751, -25.2744],
  Japan: [138.2529, 36.2048],
  Italy: [12.5674, 41.8719],
};

const FlowMap = ({ flows }) => {
  // flows = [{ from: "Philippines", to: "US", count: 50000 }, ...]

  // scale for line thickness
  const scale = d3.scaleLinear()
    .domain([0, d3.max(flows, d => d.count)])
    .range([1, 8]);

  return (
    <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140 }}>
      {/* Base map */}
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              style={{
                default: { fill: "#E5E7EB", outline: "none" },
                hover: { fill: "#CBD5E1", outline: "none" },
                pressed: { fill: "#64748B", outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {/* Markers for countries */}
      {Object.entries(locations).map(([name, coords]) => (
        <Marker key={name} coordinates={coords}>
          <circle r={4} fill={name === "Philippines" ? "#EF4444" : "#3B82F6"} />
          <text textAnchor="middle" y={-10} style={{ fontSize: 10, fill: "#111827" }}>
            {name}
          </text>
        </Marker>
      ))}

      {/* Flow lines */}
      {flows.map((f, i) => {
        const from = locations[f.from];
        const to = locations[f.to];
        if (!from || !to) return null;

        return (
          <Line
            key={i}
            from={from}
            to={to}
            stroke="#2563EB"
            strokeWidth={scale(f.count)}
            strokeLinecap="round"
            strokeOpacity={0.7}
          />
        );
      })}
    </ComposableMap>
  );
};

export default FlowMap;
