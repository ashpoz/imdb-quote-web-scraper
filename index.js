import fetch from "node-fetch";
import * as cheerio from 'cheerio';
// import cors from "cors";

export const getFilmIds = async () => {
  const response = await fetch("https://www.imdb.com/chart/top");
  const data = await response.text();
  const $ = cheerio.load(data);
  let idsArr = []
  $(".titleColumn a").each((index, el) => {
    let extractMovId = /(?<=title\/)(.*)(?=\/)/gm;
    let movId = $(el).attr("href").match(extractMovId)[0];

    if (index < 1) {
      idsArr.push(movId);
    }
  })
  console.log(idsArr);
  return idsArr;
}

const getQuotes = async () => {
  const filmIds = await getFilmIds();
  const requests = await filmIds.map(async (id, index) => {
    const urls = await fetch(`https://www.imdb.com/title/${id}/quotes`);
    const html = await urls.text();
    const $ = cheerio.load(html);

    let quoteArr = [];

    $(".quote .sodatext").each((_, el) => {
      // character
      const character = $(el).find(".character");
      // subtext lines
      const fine = $(el).find(".fine").text();
      // char arr
      let charArr = [];
      // new text
      let text = $(el).text().replaceAll(`[${fine}]`, "");

      $(character).each((_, charEl) => {
        charArr = [...charArr, $(charEl).text()];
      });

      // replace char names with Char + index
      // TODO: can move this outside of the fn so it removes ALL ref to chars
      $([...new Set(charArr)]).each((index, item) => {
        text = text.replaceAll(item, `Character ${index + 1}`);
      });

      quoteArr = [...quoteArr, text];
    });

    return {
      // urls, do I need this?
      id: index,
      quotes: quoteArr
    }
  })
  return Promise.all(requests);
}

getQuotes().then(val => console.log(val[0].quotes[2]));
