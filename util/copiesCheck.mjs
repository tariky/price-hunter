import _ from "lodash";

const copiesCheck = async (results, config) => {
  if (config.iskljuciKopijeIzRezultata) {
    var filteredResults = [];
    for (let index = 0; index < config.ukloniRezultate.length; index++) {
      const keyword = config.ukloniRezultate[index];
      const filtered = results.filter((result) => {
        if (!result.item_name.toLowerCase().includes(keyword)) {
          return result;
        }
      });
      filteredResults.push(filtered);
    }
    if (config.ukloniRezultate.length > 1) {
      const flattenResults = _.flatten(filteredResults);
      // Ukloni duplikate nastale prilikom filtriranja
      const removedDups = _.uniqBy(flattenResults, function (o) {
        return o.item_id;
      });
      return removedDups;
    } else {
      const removedDups = _.uniqBy(filteredResults, function (o) {
        return o.item_id;
      });
      return removedDups;
    }
  } else {
    return results;
  }
};

export default copiesCheck;
