const copiesCheck = async (results, config) => {
  if (config.iskljuciKopijeIzRezultata) {
    return results.filter((result) => {
      if (!result.item_name.toLowerCase().includes("kopija")) {
        return result;
      }
    });
  } else {
    return results;
  }
};

export default copiesCheck;
