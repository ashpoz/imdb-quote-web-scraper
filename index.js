import fetch from "node-fetch";
import * as cheerio from 'cheerio';
// import cors from "cors";

import fs from "fs";

export const getFilmIds = async () => {
  const response = await fetch("https://www.imdb.com/chart/top");
  const data = await response.text();
  const $ = cheerio.load(data);
  let idsArr = []
  $(".titleColumn a").each((index, el) => {
    let extractMovId = /(?<=title\/)(.*)(?=\/)/gm;
    let movId = $(el).attr("href").match(extractMovId)[0];

    idsArr.push(movId);
  });
  return idsArr;
}

const getQuotes = async () => {
  const filmIds = await getFilmIds();
  const requests = await filmIds.map(async (id, index) => {
    const urls = await fetch(`https://www.imdb.com/title/${id}/quotes`);
    const html = await urls.text();
    const $ = cheerio.load(html);

    let movieTitle = $(".subpage_title_block__right-column a").text().trim();
    let movieYear = $(".subpage_title_block__right-column span").text().replace(/[{()}]/g, "").trim();
    let quoteArr = [];
    let charArr = [];

    $(".quote .sodatext").each((index, el) => {
      if (index > 5) return;
      // character
      const character = $(el).find(".character");
      // subtext lines
      const fine = $(el).find(".fine").text();
      let text = $(el).text().replaceAll(`[${fine}]`, "");

      $(character).each((_, charEl) => {
        charArr = [...charArr, $(charEl).text()];
      });

      // replace char names with Char + index
      $([...new Set(charArr)]).each((index, item) => {
        let regex = new RegExp(`\\b${item}\\b`, "gi");
        text = text.replaceAll(regex, `[Character ${index + 1}]`);
      });

      quoteArr = [...quoteArr, text.replace(/\n/g, " ").trim()];
    });

    return {
      // grab movie title and year
      id: index,
      title: movieTitle,
      year: movieYear,
      quotes: quoteArr
    }
  });
  return Promise.all(requests);
};


getQuotes().then(data => {
  fs.writeFile('quotes.json', JSON.stringify(data), err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
});
