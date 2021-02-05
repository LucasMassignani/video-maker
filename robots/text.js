const algorithmia = require('algorithmia')
const sentenceBoundaryDetection  = require('sbd')
const NaturalLanguageUnderstandingV1  = require('ibm-watson/natural-language-understanding/v1')
const { IamAuthenticator } = require('ibm-watson/auth');

const algorithmiaKey  = require('../credentials/algorithmia.json').apiKey
const watsonApiKey  = require('../credentials/watson-nls.json').apikey

let nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
  version: '2018-04-05',
  serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com'
})

async function robot(content){
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limitMaximumSentences(content)
  await fetchKeywordsOfAllSentences(content)

  async function fetchContentFromWikipedia(content) {
    const algorithmiaAuthenticated = algorithmia(algorithmiaKey)
    const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = wikipediaResponse.get()

    content.sourceContentOriginal = wikipediaContent.content
  }

  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
    const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

    content.sourceContentSanitized = withoutDatesInParentheses

    function removeBlankLinesAndMarkdown(text) {
      const allLines = text.split('\n')

      const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
        if(line.trim().length === 0 || line.trim().startsWith('=')){
          return false
        }
        return true
      })
      return withoutBlankLinesAndMarkdown.join(' ')
    }

    function removeDatesInParentheses(text) {
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
  }
  
  function breakContentIntoSentences(content) {
    content.sentences = []
    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence)=>{
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: []
      })
    })
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  async function fetchKeywordsOfAllSentences(content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }

  async function fetchWatsonAndReturnKeywords(sentence){
    const { result } = await nlu.analyze({
      text: sentence,
      features: {
        keywords: {}
      } 
    });
  
    const keywords = result.keywords.map((keyword)=>{
      return keyword.text
    })
  
    return keywords
  }
}

module.exports = robot