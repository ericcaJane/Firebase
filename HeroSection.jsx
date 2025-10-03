import React from "react";
import { FaGlobe } from "react-icons/fa";
import { MdPeople, MdTimeline, MdBarChart, MdSchool } from "react-icons/md";

const HeroSection = ({ emigrants, emigrantsBySex, educationData, styles }) => {
  // ✅ total emigrants = sum of all civil status counts
  const totalCivil = emigrants.reduce((sum, row) => {
    const rowTotal =
      (row.single || 0) +
      (row.married || 0) +
      (row.widower || 0) +
      (row.separated || 0) +
      (row.divorced || 0) +
      (row.notReported || 0);
    return sum + rowTotal;
  }, 0);

  // ✅ total emigrants = sum of all education counts
  const totalEducation = educationData?.reduce((sum, row) => {
    const rowTotal =
      (row.elementary || 0) +
      (row.highschool || 0) +
      (row.college || 0) +
      (row.postgrad || 0) +
      (row.notReported || 0);
    return sum + rowTotal;
  }, 0) || 0;

  const yearsTracked = new Set([
    ...emigrants.map((row) => row.year),
    ...(educationData || []).map((row) => row.year),
  ]).size;

  const recordsBySex = emigrantsBySex.length;

  return (
    <div style={styles.heroCard}>
      <div style={styles.heroOverlay}>
        <div style={styles.heroContent}>
          {/* Left text */}
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              <FaGlobe /> Filipino Emigrants Dashboard
            </h1>
            <p style={styles.heroSubtitle}>
              Comprehensive analytics and visualization platform for Filipino migration data
            </p>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            {/* Civil Status Total */}
            <div style={styles.statCard}>
              <div style={styles.statIcon}><MdPeople /></div>
              <div style={styles.statContent}>
                <h3 style={styles.statNumber}>
                  {totalCivil.toLocaleString()}
                </h3>
                <p style={styles.statLabel}>Total (Civil Status)</p>
              </div>
            </div>

            {/* Education Total */}
            <div style={styles.statCard}>
              <div style={styles.statIcon}><MdSchool /></div>
              <div style={styles.statContent}>
                <h3 style={styles.statNumber}>
                  {totalEducation.toLocaleString()}
                </h3>
                <p style={styles.statLabel}>Total (Education)</p>
              </div>
            </div>

            {/* Years Tracked */}
            <div style={styles.statCard}>
              <div style={styles.statIcon}><MdTimeline /></div>
              <div style={styles.statContent}>
                <h3 style={styles.statNumber}>{yearsTracked}</h3>
                <p style={styles.statLabel}>Years Tracked</p>
              </div>
            </div>

            {/* Records by Sex */}
            <div style={styles.statCard}>
              <div style={styles.statIcon}><MdBarChart /></div>
              <div style={styles.statContent}>
                <h3 style={styles.statNumber}>{recordsBySex}</h3>
                <p style={styles.statLabel}>Records by Sex</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSection;
