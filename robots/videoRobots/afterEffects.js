const path = require('path')
const gm = require('gm').subClass({imageMagick: true})
const videoImage = require('./videoImage')
const state = require('../state')
const spawn = require('child_process').spawn
const rootPath = path.resolve(__dirname, '..')


async function robot() {
  console.log('> [video-robot][after-effects] Starting...')
  const content = state.load()

  await videoImage()
  createAfterEffectsScript(content)
  await renderVideoWithAfterEffects()

  state.save(content)

  function createAfterEffectsScript(content) {
    state.saveScript(content)
  }

  async function renderVideoWithAfterEffects() {
    return new Promise((resolve, reject) => {
      const aerenderFilePath = 'C:/Program Files/Adobe/Adobe After Effects 2020/Support Files/aerender.exe'
      const templateFilePath = `${rootPath}/templates/1/template.aep`
      const destinationFilePath = `${rootPath}/content/output.mov`

      console.log('> [video-robot][after-effects] Starting After Effects')

      const aerender = spawn(aerenderFilePath, [
        '-comp', 'main',
        '-project', templateFilePath, 
        '-output', destinationFilePath
      ])

      aerender.stdout.on('data', (data)=>{
        process.stdout.write(data)
      })

      aerender.stdout.on('close', ()=>{
        console.log('> [video-robot][after-effects] After Effects closed')
        resolve()
      })
    })
  }
  
}

module.exports = robot
