const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const isTuesday = require("date-fns/isTuesday");
const previousMonday = require("date-fns/previousMonday");

const app = express();
app.use(express.json()); // JSON 요청 바디를 파싱하기 위한 설정

// CORS 설정
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://port-0-sy-cheerio-2rrqq2blmlvy0fh.sel5.cloudtype.app",
    "https://k-drama-rate.sooyadev.com",
    "https:/sooyadev.com",
    "http://localhost:3000",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin); // 요청한 출처만 허용
  }

  res.setHeader("Access-Control-Allow-Credentials", "true"); // 쿠키 허용
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // OPTIONS 요청에 대해 응답
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

const getInfoRate = async (title) => {
  let obj = {};
  obj.casting = {};
  obj.list = [];

  //기본정보 및 시청률 url
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
      const url = `https://search.daum.net/search?w=tv&q=${title}&irt=tv-program&irk=${code}&DA=TVP`;
      const data = {
        code,
        url,
      };
      return data;
    });

  if (!rateData.code) return;
  //시청률 추이정보
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
        if ($(el).find("td:nth-child(2)").text().indexOf("회") > -1) {
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
      const list = $(".scroll_bx > .tb_list tbody tr");
      list.each((i, el) => {
        const title = $(el).find("td:nth-child(2) p").text();
        const ch = $(el).find("td:nth-child(3) p a").text();
        const rate = $(el).find("td:nth-child(4) p.rate").text();
        arr.push({
          title,
          ch,
          rate,
        });
      });
    });
  return arr;
};

//전체 시청률 순위
app.get("/getRank", async (req, res) => {
  let month = req.query.month;
  let date = req.query.date;

  const initUrl = `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20지상파시청률`;
  const jongUrl = `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20종합편성시청률`;
  const caUrl = `https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blUw&qvt=0&query=${month}월${date}일주%20드라마%20케이블시청률`;

  let arr = [];
  const data1 = await getRankData(initUrl);
  const data2 = await getRankData(jongUrl);
  const data3 = await getRankData(caUrl);
  arr = [...data1, ...data2, ...data3];
  res.json({
    list: JSON.stringify(arr),
  });
});

//시청률 추이
app.get("/getRateAll", async (req, res) => {
  const rateData = await getInfoRate(req.query.title);
  if (!rateData) {
    return res.send("");
  } else {
    res.json({
      casting: rateData.casting,
      list: JSON.stringify(rateData.list),
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

const server = app.listen(process.env.PORT || "443", () => {
  console.log("server listening on port %s", server.address().port);
});
