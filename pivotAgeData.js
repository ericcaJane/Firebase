// utils/pivotAgeData.js
export const pivotAgeData = (rows) => {
  const pivot = {};

  rows.forEach((r) => {
    if (!r.year || !r.ageGroup) return;

    if (!pivot[r.year]) {
      pivot[r.year] = { year: r.year };
    }

    pivot[r.year][r.ageGroup] = r.count;
  });

  // return as array sorted by year
  return Object.values(pivot).sort((a, b) => a.year - b.year);
};
