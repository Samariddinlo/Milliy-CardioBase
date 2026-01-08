const { analyzeWithDataset } = require("./ai-engine");
const dataset = require("./data/pediatric_heart_dataset_uz.json");

const inputSymptoms = {
  holsizlik: true,
  tez_charchash: true,
  tez_yurak_urishi: true
};

const results = analyzeWithDataset(
  inputSymptoms,
  dataset.acquired,
  3
);

console.table(results);