const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const previousMonday = require("date-fns/previousMonday");

const app = express();

// 1. CORS 설정 개선
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = "*";
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 2. 모든 요청에 필요한 CORS 헤더 설정
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// 3. OPTIONS 프리플라이트 요청 처리
app.options("*", (req, res) => {
  res.sendStatus(200);
});

const getInfoRate = async (title) => {
  let obj = { casting: {}, list: [] };

  const rateData = await axios
    .get(
      `https://search.daum.net/search?nil_suggest=btn&w=tot&DA=SBC&q=${title} 출연진`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        },
      }
    )
    .then(async (res) => {
      const $ = cheerio.load(res.data);
      const link = $(".head_cont .inner_cont a").attr("href");
      const title = $(".head_cont .inner_cont a").text();
      const code = link ? link.split("&irk=")[1].split("&")[0] : "";

      const castArr = [];
      $(".castingList .sub_name a").each((i, el) => castArr.push($(el).text()));
      obj.casting = castArr;

      return {
        code,
        url: `https://search.daum.net/search?w=tv&q=${title}&irt=tv-program&irk=${code}&DA=TVP`,
      };
    });

  if (!rateData.code) return;

  await axios
    .get(rateData.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      $(".tbl_rank tbody > tr").each((i, el) => {
        let temp;
        if ($(el).find("td:nth-child(2)").text().includes("회")) {
          temp = {
            date: $(el).find("td:nth-child(1)").text(),
            num: $(el).find("td:nth-child(2)").text(),
            rate: $(el).find("td:nth-child(3)").text(),
          };
        } else {
          temp = {
            date: $(el).find("td:nth-child(1)").text(),
            num: "",
            rate: $(el).find("td:nth-child(2)").text(),
          };
        }
        obj.list.push(temp);
      });
    });

  return obj;
};

const getRankData = async (url) => {
  let arr = [];
  await axios
    .get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      $(".scroll_bx > .tb_list tbody tr").each((i, el) => {
        arr.push({
          title: $(el).find("td:nth-child(2) p").text(),
          ch: $(el).find("td:nth-child(3) p a").text(),
          rate: $(el).find("td:nth-child(4) p.rate").text(),
        });
      });
    });

  return arr;
};

// 전체 시청률 순위
app.get("/getRank", async (req, res) => {
  const { month, date } = req.query;

  const urls = [
    `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20지상파시청률`,
    `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20종합편성시청률`,
    `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20케이블시청률`,
  ];

  const data = await Promise.all(urls.map(getRankData));
  const list = data.flat();
  res.json({ list: JSON.stringify(list) });
});

// 시청률 추이
app.get("/getRateAll", async (req, res) => {
  const rateData = await getInfoRate(req.query.title);
  if (!rateData) {
    return res.status(404).send("Data not found");
  }
  res.json({
    casting: rateData.casting,
    list: JSON.stringify(rateData.list),
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

const server = app.listen(process.env.PORT || 4000, () => {
  console.log("server listening on port %s", server.address().port);
});
