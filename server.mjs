import puppeteer from "puppeteer";
import _ from "lodash";
import config from "./config.mjs";
import priceFilter from "./util/priceFilter.mjs";
import copiesCheck from "./util/copiesCheck.mjs";
import checkForPrice from "./util/checkForPrice.mjs";
import calculateMedianPrice from "./util/calculateMedianPrice.mjs";
import findLowestPrice from "./util/findLowestPrice.mjs";
import findHighestPrice from "./util/findHighestPrice.mjs";

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
    // Provjera da li ima preko 1000 rezultata... jer na olx su 1000 => 1.000
    if (totalResult.split(".").length === 2) {
      const removeDotFromNumber = totalResult.replaceAll(".", "");
      const numberOfItemsPerPage = 30;
      const calculateNumberOfPages =
        Number(removeDotFromNumber) / numberOfItemsPerPage;
      const result =
        calculateNumberOfPages - Math.floor(calculateNumberOfPages) !== 0;
      if (result) {
        return Math.floor(calculateNumberOfPages) + 2;
      } else {
        return calculateNumberOfPages;
      }
    } else {
      const numberOfItemsPerPage = 30;
      const calculateNumberOfPages =
        Number(removeDotFromNumber) / numberOfItemsPerPage;
      const result =
        calculateNumberOfPages - Math.floor(calculateNumberOfPages) !== 0;
      if (result) {
        return Math.floor(calculateNumberOfPages) + 2;
      } else {
        return calculateNumberOfPages;
      }
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
  console.log(numberOfPages);
  const checkForCopies = await copiesCheck(results, config);
  const priceFiltering = await priceFilter(checkForCopies, config);
  return priceFiltering;
};

const magic = async (page) => {
  return await page.evaluate(function () {
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
      // Provjeri da li cijena ima comma
      const check_comma = price.split(",");
      if (check_comma.length > 1) {
        // Prvi prolaz ukloni KM
        const first_pass = price.split("K")[0];
        // Drugi uklonii tacki
        const second_pass = first_pass.replaceAll(".", "");
        // ukloni comma
        const third_pass = second_pass.split(",")[0];
        return Number(third_pass);
      } else {
        // Prvi prolaz ukloni KM
        const first_pass = price.split("K")[0];
        // Drugi uklonii tacki
        const second_pass = first_pass.replaceAll(".", "");
        // Vrati u number formatu
        return Number(second_pass);
      }
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

const results = await scrape(config.linkPretrage);
if (results.length === 0) {
  console.log("Nema rezultata");
} else {
  console.log(await checkForPrice(config.trazenaCijena, results));
  console.log(await calculateMedianPrice(results));
  console.log(await findLowestPrice(results));
  console.log(await findHighestPrice(results));
}
