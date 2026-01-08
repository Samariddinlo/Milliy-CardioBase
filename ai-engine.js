function analyzeWithDataset(inputSymptoms, dataset, top = 3) {
  const results = [];

  dataset.forEach(disease => {
    let score = 0;
    let total = 0;

    for (const s in disease.symptoms) {
      total += disease.symptoms[s];
      if (inputSymptoms[s]) {
        score += disease.symptoms[s];
      }
    }

    const percent = total > 0
      ? Math.round((score / total) * 100)
      : 0;

    if (percent > 15) {
      results.push({
        id: disease.id,
        name: disease.name,
        percent
      });
    }
  });

  return results
    .sort((a, b) => b.percent - a.percent)
    .slice(0, top);
}

module.exports = {
  analyzeWithDataset
};