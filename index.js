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

request(url, (error, response, body) => {
  if (error) throw error;
  let $ = cheerio.load(body);
  try {
    var sum = 0;
    var size = 0;
    $("tbody tr td:nth-child(6)").each(function (index, elem) {
      var rate_text = $(this).text(); //해당 태그의 text부분만 잘라오기
      var filtered_rate_text = rate_text.substring(0, rate_text.length - 1); //'%'자르기
      var rate = parseFloat(filtered_rate_text); //문자열 형태의 정답률을 float형으로 변환
      console.log(rate);
      sum += rate;
      size += $(this).length;
    });
    console.log("Size=" + size);
    console.log("Average Correct Percentage=" + (sum / size).toFixed(3) + "%");
  } catch (error) {
    console.error(error);
  }
});

app.get("/getMessage", async (req, res) => {});

const server = app.listen(process.env.PORT || "3000", () => {
  console.log("server listening on port %s", server.address().port);
});
