const priceFilter = async (results, config) => {
  return results.filter((result) => {
    if (result.price > config.cijenaOd && result.price < config.cijenaDo) {
      return result;
    }
  });
};

export default priceFilter;
