import _ from "lodash";

const calculateMedianPrice = async (results) => {
  const itemsCount = results.length;
  const totalPriceOfAllItems = _.sumBy(results, function (o) {
    return o.price;
  });
  const medianPrice = Number(totalPriceOfAllItems) / Number(itemsCount);
  return `Prosjeca cijena svih artikala: ${medianPrice.toFixed(2)}KM`;
};

export default calculateMedianPrice;
