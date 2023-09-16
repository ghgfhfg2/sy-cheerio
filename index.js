const express = require("express");
const cors = require("cors");
const request = require("request");
const cheerio = require("cheerio");

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
const getData = () => {
  request(
    "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=%EC%A3%BC%EA%B0%84%EB%93%9C%EB%9D%BC%EB%A7%88%20%EC%8B%9C%EC%B2%AD%EB%A5%A0",
    (err, res, body) => {
      const $ = cheerio.load(body);
      const list = $(".scroll_bx > .tb_list tbody tr").map((i, el) => {
        const text = $(el).find("td:nth-child(2) p a").text();
        return text;
      });

      console.log(list);
    }
  );
};
//getData();
app.get("/getMessage", async (req, res) => {
  request(
    "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=%EC%A3%BC%EA%B0%84%EB%93%9C%EB%9D%BC%EB%A7%88%20%EC%8B%9C%EC%B2%AD%EB%A5%A0",
    (err, res, body) => {
      const $ = cheerio.load(body);
      const list = $(".scroll_bx > .tb_list tbody tr").map((i, el) => {
        const text = $(el).find("td:nth-child(2) p a").text();
        return text;
      });
      res.json({
        test: "1",
        list,
      });
    }
  );
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = app.listen(process.env.PORT || "4000", () => {
  console.log("server listening on port %s", server.address().port);
});
