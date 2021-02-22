const path = require('path')
const fs = require('fs')
const gm = require('gm').subClass({imageMagick: true})
const videoImage = require('./videoImage')
const spawn = require('child_process').spawn
const rootPath = path.resolve(__dirname, '..')
const ffmpegFilePath = 'E:/ffmpeg/bin/ffmpeg.exe'

async function robot() {
  console.log('> [video-robot][ffmpeg] Starting...')

  await videoImage()
  await renderVideoFfmpeg()

  async function renderVideoFfmpeg() {
    console.log('> [video-robot][ffmpeg] Starting ffmpeg')

    await createImageSequence()
    await decreaseAllImagesBrightness()
    await putAllImagesText()
    await putMusic()
    console.log('> [video-robot][ffmpeg] Ffmpeg closed')
  }

  async function createImageSequence() {
    return new Promise((resolve, reject) => {
      const destinationFilePath = `./content/output.mp4`

      const params = {}

      if(process.platform.includes('win')) {
        params.shell = 'powershell.exe'
      }

      const imageSequence = spawn(ffmpegFilePath, [
        '-r', '1/10', 
        '-i', `'./content/%d-converted.png'`, 
        '-c:v', 'libx264', 
        '-vf', 'fps=25', 
        '-pix_fmt', 'yuv420p', 
        destinationFilePath,
        '-y',
      ], params)
      
      imageSequence.stdout.on('data', (data) => {
        process.stdout.write(data)
      })

      imageSequence.stdout.on('close', () => {
        resolve()
      })
    })
  }
  
  async function decreaseAllImagesBrightness() {
    for (let i = 0; i < 7; i++) {
      await decreaseImageBrightness(i)
    }
  }

  async function decreaseImageBrightness(imageIndex) {
    const destinationFilePath = "./content/output.mp4"
    const time = imageIndex * 10

    return new Promise((resolve, reject) => {
      const params = {}

      if(process.platform.includes('win')) {
        params.shell = 'powershell.exe'
      }
      
      const imageSequence = spawn(ffmpegFilePath, [
        '-i', destinationFilePath, 
        '-vf', `"eq=brightness=-0.25:enable='between(t,${3 + time},${10 + time})'"`, 
        '-c:a', 'copy',
        './content/draft_output.mp4',
        '-y',
      ], params)
      
      imageSequence.stdout.on('data', (data) => {
        process.stdout.write(data)
      })

      imageSequence.stdout.on('close', () => {
        fs.renameSync(path.resolve('content', 'draft_output.mp4'), path.resolve('content', 'output.mp4'))
        resolve()
      })
    })
  }

  async function putAllImagesText() {
    for (let i = 0; i < 7; i++) {
      await putImageText(i)
    }
  }

  async function putImageText(imageIndex) {
    const destinationFilePath = "./content/output.mp4"
    const time = imageIndex * 10;

    return new Promise((resolve, reject) => {
      const params = {}

      if(process.platform.includes('win')) {
        params.shell = 'powershell.exe'
      }

      const imageSequence = spawn(ffmpegFilePath, [
        '-i', destinationFilePath, 
        '-i', `./content/${imageIndex}-sentence.png`, 
        '-filter_complex', `"[0:v][1:v] overlay=0:0:enable='between(t,${3 + time},${10 + time})'"`, 
        '-pix_fmt', 'yuv420p', 
        '-c:a', 'copy', 
        './content/draft_output.mp4',
        '-y',
      ], params)
      
      imageSequence.stdout.on('data', (data) => {
        process.stdout.write(data)
      })

      imageSequence.stdout.on('close', () => {
        fs.renameSync(path.resolve('content', 'draft_output.mp4'), path.resolve('content', 'output.mp4'))
        resolve()
      })
    })
  }

  async function putMusic() {
    const destinationFilePath = "./content/output.mp4"

    return new Promise((resolve, reject) => {
      const params = {}

      if(process.platform.includes('win')) {
        params.shell = 'powershell.exe'
      }

      const imageSequence = spawn(ffmpegFilePath, [
        '-i', destinationFilePath, 
        '-i', './content/newsroom.mp3', 
        '-map', '0', 
        '-map', '1:a', 
        '-c:v', 'copy', 
        '-shortest', './content/draft_output.mp4', 
        '-y',
      ], params)
      
      imageSequence.stdout.on('data', (data) => {
        process.stdout.write(data)
      })

      imageSequence.stdout.on('close', () => {
        fs.renameSync(path.resolve('content', 'draft_output.mp4'), path.resolve('content', 'output.mp4'))
        resolve()
      })
    })
  }
}

module.exports = robot