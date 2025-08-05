// pages/api/medium-article.js
import https from 'https';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.startsWith("https://medium.com/")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  https.get(url, (resp) => {
    let data = "";

    resp.on("data", (chunk) => {
      data += chunk;
    });

    resp.on("end", () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).send(data);
    });

  }).on("error", (err) => {
    res.status(500).json({ error: err.message });
  });
}
