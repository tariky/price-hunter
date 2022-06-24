const checkForPrice = async (price, results) => {
  return results.filter((result) => {
    return result.price <= Number(price);
  });
};

export default checkForPrice;
