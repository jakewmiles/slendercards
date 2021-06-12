const express = require('express');
const cors = require('cors');
const tts = require('google-translate-tts');
const router = require('./router');
const Reverso = require('reverso-api');
const reverso = new Reverso();
const app = express();
const port = 3000;


app.use(cors());
app.use(express.json())

const getSentences = (phrase, srcLang, targLang) => {
  return reverso.getContext(phrase, srcLang, targLang)
			.then(response => {
        return response;
			})
			.catch(err => {
				console.log(err);
			})
};

app.post('/scrape', async (req, res) => {
  try {
    const {phraseQuery, srcLang, targLang} = req.body;
    const reversoResult = await getSentences(phraseQuery, srcLang, targLang);
    res.status(200)
    res.send(reversoResult)
  } catch (err) {
    res.status(500);
    res.send('This failed');
  }
})

app.use(router);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})

