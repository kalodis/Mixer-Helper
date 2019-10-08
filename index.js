const { MixerBot } = require('@sighmir/jsmixer')
const Server = require('webserver.io')
const express = require('express')
const path = require('path')
const fs = require('fs')

let conf = JSON.parse(fs.readFileSync('config.json', 'utf8'))

global.mbot = new MixerBot(conf.clientId, conf.clientSecret, conf.scope)

mbot.conf = conf
mbot.server = new Server()
mbot.prefix = conf.prefix
require('./modules')

mbot.auth().then(async () => {
  mbot.user = await mbot.getCurrentUser()
  mbot.user.chat = await mbot.getChat(mbot.user.channel.id)
  require('./commands')
  mbot.chat = await mbot.join(mbot.user.channel, mbot.user.chat)
}).catch(err => mbot.log.error(err))

mbot.server.set('view engine', 'ejs')
mbot.server.set('views', path.join(__dirname, 'public'))
mbot.server.use('/', express.static(path.join(__dirname, 'public')))

mbot.server.on('connection', (client, req) => {
  client = new mbot.Client(client)
  mbot.log.info(`Client connected (${req.connection.remoteAddress})`)
})

mbot.server.http.listen(4000)
mbot.log.info(`Bot API listening on localhost:4000`)