import _ from "lodash";

const findHighestPrice = async (results) => {
  const result = _.maxBy(results, function (o) {
    return o.price;
  });
  return `Najvisa cijena u pretrazi: ${result.price.toFixed(2)}KM \nLink: ${
    result.olx_link
  }`;
};

export default findHighestPrice;
