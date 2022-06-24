import puppeteer from "puppeteer";
import _ from "lodash";
import config from "./config.mjs";

const scrape = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("#rezultatipretrage");

  var results = [];
  const numberOfPages = await page.evaluate(() => {
    const totalResult = document
      .querySelectorAll(".brojrezultata")[0]
      .querySelectorAll("span")[0].innerText;
    const numberOfItemsPerPage = 30;
    const calculateNumberOfPages = Number(totalResult) / numberOfItemsPerPage;
    const result =
      calculateNumberOfPages - Math.floor(calculateNumberOfPages) !== 0;
    if (result) {
      return Math.floor(calculateNumberOfPages) + 2;
    } else {
      return calculateNumberOfPages;
    }
  });

  for (let index = 1; index < numberOfPages; index++) {
    await page.waitForSelector("#rezultatipretrage");
    results = results.concat(await magic(page));
    if (index === 1) {
      console.log("Page - 1 - Scraped");
    }
    if (index < numberOfPages) {
      // nema next page dugmeta na zadnjoj stranici
      await page.waitForTimeout(config.cekanjeIzmjeduStranica);
      await page.goto(`${url}&stranica=${index + 1}`);
      console.log(`${url}&stranica=${index + 1}`);
    }
  }
  await browser.close();
  return results;
  //   return numberOfPages;
};

const magic = async (page) => {
  return await page.evaluate(() => {
    /*
          Ova funkcija rjesava problem sa snizenim cijenama koje su prikazne na OLX
          ukoliko postoji snizena cijena biti ce filtrirana i prikazana kao cijena u sistemu
        */
    function checkIfCompareAtPrice(price) {
      const result = price.split("\n");
      if (result.length > 1) {
        return result[1];
      } else {
        return price;
      }
    }

    /*
          Ova funkcija uklanja po dogovoru cijene i mjenja ih sa -1 cijenom
        */
    function checkIfPoDogovoru(price) {
      if (price == "PO DOGOVORU") {
        return "-1";
      } else {
        return price;
      }
    }

    /*
          Ova funkcija uklanja valutu iz cijene, brise tacku i pretvara
          cijenu u stvari Number format
        */
    function removeCurrencyFromPrice(price) {
      // Prvi prolaz ukloni KM
      const first_pass = price.split("K")[0];
      // Drugi uklonii tacki
      const second_pass = first_pass.replaceAll(".", "");
      // Vrati u number formatu
      return Number(second_pass);
    }

    var ids = [];
    const pretraga = Array.from(document.querySelectorAll(".listitem"));
    pretraga.forEach((item) => {
      if (item.querySelectorAll(".na").length !== 0) {
        const item_id = item.getAttribute("id");
        const item_name = item.querySelectorAll(".na")[0].innerText;
        const olx_link = item
          .querySelectorAll(".naslov")[0]
          .querySelectorAll("a")[0]
          .getAttribute("href");
        // Prvo provjeri da li je snizeno
        const filtered_price = checkIfCompareAtPrice(
          item.querySelectorAll(".datum")[0].querySelectorAll("span")[0]
            .innerText
        );
        // Drugo provjeri da li je cijena po dogovoru
        const po_dogovoru_check = checkIfPoDogovoru(filtered_price);
        // Trece ukloni valutu, izbrisi tacku i pretvori u broj
        const price = removeCurrencyFromPrice(po_dogovoru_check);
        ids.push({
          item_id,
          item_name,
          price,
          olx_link,
        });
      }
    });
    console.log(ids);
    return ids;
  });
};

// Pronadji artikle koji su jednaki ili ispod definisane cijene
const checkForPrice = async (price, results) => {
  return results.filter((result) => {
    return result.price <= Number(price);
  });
};

const calculateMedianPrice = async (results) => {
  const itemsCount = results.length;
  const totalPriceOfAllItems = _.sumBy(results, function (o) {
    return o.price;
  });
  const medianPrice = Number(totalPriceOfAllItems) / Number(itemsCount);
  return `Prosjeca cijena svih artikala: ${medianPrice.toFixed(2)}KM`;
};

const findLowestPrice = async (results) => {
  const result = _.minBy(results, function (o) {
    // Provjeri da cijena nije po dogovortu (-1)
    if (o.price !== -1) {
      return o.price;
    }
  });
  return `Najniza cijena u pretrazi: ${result.price.toFixed(2)}KM  - Link: ${
    result.olx_link
  }`;
};

const findHighestPrice = async (results) => {
  const result = _.maxBy(results, function (o) {
    return o.price;
  });
  return `Najvisa cijena u pretrazi: ${result.price.toFixed(2)}KM - Link: ${
    result.olx_link
  }`;
};

const results = await scrape(config.linkPretrage);
console.log(await checkForPrice(config.trazenaCijena, results));
console.log(await calculateMedianPrice(results));
console.log(await findLowestPrice(results));
console.log(await findHighestPrice(results));
