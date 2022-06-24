import _ from "lodash";

const findLowestPrice = async (results) => {
  const result = _.minBy(results, function (o) {
    // Provjeri da cijena nije po dogovortu (-1)
    if (o.price !== -1) {
      return o.price;
    }
  });
  return `Najniza cijena u pretrazi: ${result.price.toFixed(2)}KM  \nLink: ${
    result.olx_link
  }`;
};

export default findLowestPrice;
