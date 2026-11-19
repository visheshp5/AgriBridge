
function calculateNetEarnings(option, quantity) {
  const grossRevenue = quantity * option.pricePerQuintal;

  const totalCosts =
    option.transportCost +
    option.otherCosts;

  return {
    grossRevenue,
    totalCosts,
    netEarnings: grossRevenue - totalCosts,
  };
}

function recommendBestSellingOption(quantity, options) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  if (!Array.isArray(options) || options.length === 0) {
    throw new Error("At least one selling option is required");
  }

  const evaluatedOptions = options.map((option) => {
    const requiredValues = [
      option.pricePerQuintal,
      option.transportCost,
      option.otherCosts,
    ];

    if (
      !option.name ||
      requiredValues.some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      throw new Error(`Invalid data for ${option.name || "selling option"}`);
    }

    const result = calculateNetEarnings(option, quantity);

    return {
      ...option,
      ...result,
    };
  });

  evaluatedOptions.sort(
    (a, b) => b.netEarnings - a.netEarnings
  );

  const bestOption = evaluatedOptions[0];
  const secondBest = evaluatedOptions[1];

  return {
    recommendedOption: bestOption,

    comparison: evaluatedOptions,

    explanation: secondBest
      ? `${bestOption.name} offers the highest estimated net earnings of ₹${bestOption.netEarnings.toFixed(2)}, which is ₹${(bestOption.netEarnings - secondBest.netEarnings).toFixed(2)} more than the next-best option.`
      : `${bestOption.name} is the only available option, with estimated net earnings of ₹${bestOption.netEarnings.toFixed(2)}.`,
  };
}

module.exports = { recommendBestSellingOption };
