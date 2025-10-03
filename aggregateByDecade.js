export const aggregateByDecade = (rows) => {
  const decadeMap = {};

  rows.forEach((r) => {
    if (!r.year || !r.ageGroup) return;
    if (r.ageGroup.toUpperCase().includes("TOTAL")) return; // 🚫 skip TOTAL rows

    // Find decade, e.g., 1981 → 1980s
    const decade = Math.floor(r.year / 10) * 10 + "s";

    // Create base structure
    if (!decadeMap[r.ageGroup]) {
      decadeMap[r.ageGroup] = { ageGroup: r.ageGroup, "1980s": 0, "1990s": 0, "2000s": 0, "2010s": 0 };
    }

    // Add counts
    if (decadeMap[r.ageGroup][decade] !== undefined) {
      decadeMap[r.ageGroup][decade] += r.count;
    }
  });

  // Return as array, sorted by age group (optional)
  return Object.values(decadeMap).sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));
};
