import * as googleTTS from 'google-tts-api';
import Reverso from 'reverso-api';
const reverso = new Reverso();

export const getTextToSpeech = async (phrase, targLang) => {
  try {
    const url = googleTTS.getAudioUrl(phrase, {
      lang: languageCodes[targLang],
      host: 'https://translate.google.com',
    });
    return url;
  } catch (err) {
    console.error(err);
  }
};

const languageCodes = {
  English: 'en-GB',
  Spanish: 'es-ES',
  Italian: 'it-IT',
  French: 'fr-FR',
  German: 'de-DE',
  Polish: 'pl-PL',
  Russian: 'ru-RU',
  Portuguese: 'pt-PT',
  Japanese: 'ja',
  Chinese: 'zh-CN',
};

export const getSentences = (phrase, srcLang, targLang) => {
  return reverso
    .getContext(phrase, srcLang, targLang)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      console.log(err);
    });
};
