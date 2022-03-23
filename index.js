const mp = require('minecraft-protocol')
const dotenv = require('dotenv')
const path = require('path')
const { once } = require('events')
const ChatMessage = require('prismarine-chat')('1.12.2')
const { setTimeout } = require('timers/promises')
const express = require('express')
dotenv.config()

const app = express()

app.get('/', (req, res) => {
  res.json({
    updatedAt: updatedAt ? updatedAt.getTime() : null,
    queueLength: queueLength
  })
})

app.listen(process.env.WEBPORT)

let queueLength = -1
let updatedAt = null

async function connect() {
  const client = mp.createClient({
    host: '2b2t.org',
    version: '1.12.2',
    username: process.env.MCUSERNAME,
    auth: 'microsoft',
    profilesFolder: path.resolve('./profiles')
  })

  client.on('error', console.error)
  client.on('chat', (data, meta) => {
    try {
      console.info(data)
      debugger
      const msg = new ChatMessage(JSON.parse(data?.message))?.toString()
      console.info(msg)
      if (msg && msg.includes('Position in queue')) {
        const match = msg.match(/Position in queue: (\d+)/)
        const pos = Number(match ? match[1] : NaN)
        if (isNaN(pos)) return
        queueLength = pos
        updatedAt = new Date()
        client.end()
        console.info('disconnecting')
      }
    } catch (err) {
      console.error(err)
    }
  })
  
  await once(client, 'end')
}

async function init() {
  while (true) {
    await connect()
    await setTimeout(30000)
  }
}

init()