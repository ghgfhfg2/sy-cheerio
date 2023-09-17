const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

let scrapingResult = {
  date: "",
  the_basic_rate: "",
  buy: "",
  sell: "",
};

app.get("/getRank", async (req, res) => {
  axios
    .get(
      "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=%EC%A3%BC%EA%B0%84%EB%93%9C%EB%9D%BC%EB%A7%88%20%EC%8B%9C%EC%B2%AD%EB%A5%A0"
    )
    .then((res2) => {
      const $ = cheerio.load(res2.data);
      let arr = [];
      const list = $(".scroll_bx > .tb_list tbody tr");
      list.each((i, el) => {
        const rank = $(el).find("td:nth-child(1) p .blind").text();
        const title = $(el).find("td:nth-child(2) p a").text();
        const ch = $(el).find("td:nth-child(3) p a").text();
        arr.push({
          rank,
          title,
          ch,
        });
      });
      console.log(arr);
      res.json({
        tset: "test",
        test2: JSON.stringify(arr),
      });
    });
});

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

const server = app.listen(process.env.PORT || "4000", () => {
  console.log("server listening on port %s", server.address().port);
});
