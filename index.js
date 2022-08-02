import fetch from "node-fetch";
import * as cheerio from 'cheerio';
// import cors from "cors";

export const getFilmIds = async () => {
  const response = await fetch("https://www.imdb.com/chart/top");
  const data = await response.text();
  const $ = cheerio.load(data);
  let idsArr = []
  $(".titleColumn a").each((_, el) => {
    let extractMovId = /(?<=title\/)(.*)(?=\/)/gm;
    let movId = $(el).attr("href").match(extractMovId)[0];
    idsArr.push(movId);
  })
  return idsArr;
}

const getQuotes = async () => {
  const filmIds = await getFilmIds();
  const requests = await filmIds.map(async id => {
    const urls = await fetch(`https://www.imdb.com/title/${id}/quotes`);
    const html = await urls.text();
    const $ = cheerio.load(html);
    return {
      urls,
      quote: $(".quote .sodatext p")
    }
  })
  return Promise.all(requests);
}

getQuotes().then(val => console.log(val));
