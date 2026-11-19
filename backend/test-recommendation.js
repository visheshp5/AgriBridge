
const {
  recommendBestSellingOption
} = require("./src/services/recommendation.service");

const quantity = 20;

const options = [
  {
    name: "Agra Mandi",
    type: "mandi",
    pricePerQuintal: 2400,
    transportCost: 500,
    otherCosts: 200,
  },
  {
    name: "Hathras Mandi",
    type: "mandi",
    pricePerQuintal: 2500,
    transportCost: 1000,
    otherCosts: 200,
  },
  {
    name: "Buyer A",
    type: "buyer",
    pricePerQuintal: 2450,
    transportCost: 300,
    otherCosts: 100,
  },
];

const result = recommendBestSellingOption(quantity, options);

console.log(JSON.stringify(result, null, 2));
