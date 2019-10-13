let lurkOn = mbot.conf.lurkOn || true
const request = require("request")
mbot.db.getSync('lurks', [])
const lurkInterval = mbot.conf.lurkInterval
const lurkMessages = mbot.conf.lurkMessages

connectToLurks = async () => {
  for (let token of mbot.lurks) {
    if (token != mbot.user.channel.token) {
      let channel = await mbot.getChannel(token)
      let chat = await mbot.getChat(channel.id)
      chat = await mbot.join(channel, chat)
      mbot.log.info(`Connected to ${channel.token}`)
    } else {
      mbot.log.info(`Already connected to ${token}`)
    }
  }
}
request.get('https://mixer-helper.s3.amazonaws.com/lurks.json', (err, res, body) => {
    if (!err && res.statusCode == 200) {
        const data = JSON.parse(body);
        mbot.lurks.push(...data)
    }
    mbot.lurks = Array.from(new Set(mbot.lurks))
    connectToLurks()
})

messageLurks = async () => {
  if (lurkOn) {
    for (let token of mbot.lurks) {
      let channel = await mbot.getChannel(token)
      let message = lurkMessages[Math.floor(Math.random()*lurkMessages.length)]
      if (channel.online) {
        try {
          mbot.chats[token].msg(message)
        } catch (err) {
          let uchat = await mbot.getChat(channel.id)
          let chat = await mbot.join(channel, uchat)
          chat.msg(message)
        }
        mbot.log.info(`Messaged ${token}`)
      } else mbot.log.info(`${token} is offline`)
      if (mbot.lurks.length >= 1000) await mbot.delay(3500)
    }
  }
}
setInterval(messageLurks, 1000 * 60 * lurkInterval)

mbot.addCommandHandler('lurkon', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      lurkOn = true
      chat.msg(`Lurk Messages have been enabled.`)
    }
  }
})

mbot.addCommandHandler('lurkoff', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      lurkOn = false
      chat.msg(`Lurk Messages have been disabled.`)
    }
  }
})

mbot.addMessageHandler(async (chat, data, args) => {
  let msg = data.message.message[0].text.toLowerCase()
  if ((msg.includes('l4l') || msg .includes('lurk') || msg .includes('lurking')) && data.channel == mbot.user.channel.id && data.user_id != mbot.user.id) {
    try {
        let user = await mbot.getUser(data.user_id)
        if (data.user_id === mbot.user.id && args[0]) {
          user.channel = await mbot.getChannel(args[0])
        }
        if (user.channel.token != "undefined") {
          let uchat = await mbot.getChat(user.channel.id)
          if ((data.user_name) && data.channel == mbot.user.channel.id)
          if (mbot.utils.add(mbot.lurks, user.channel.token)) {
            console.log(`[L4L] Added channel ${user.channel.token}`)
            chat.msg(`@${user.channel.token}'s channel has been added to our lurk list!`).catch(err => console.log(err))
            mbot.db.set('lurks')
          } else console.log(`[L4L] Channel ${user.channel.token} already added`)
          if (!mbot.chats[user.channel.token]) {
            await mbot.join(user.channel, uchat)
          } else {
            chat.msg(`@${user.channel.token}'s channel is already on my lurk list! `).catch(err => console.log(err))
            console.log(`[L4L] Already connected to ${user.channel.token}`)
          }
        } else {
          console.log(`[L4L] Channel ${user.channel.token} doesn't exist`)
        }
      // }
    } catch (err) {
      console.log(err)
    }
  }
})

mbot.addCommandHandler('stop', async (chat, data, args) => {
  try {
    if (data.channel == mbot.user.channel.id) {
      if (data.user_id === mbot.user.id) {
        let channel = await mbot.getChannel(args[0])
        if (mbot.chats[channel.token]) {
          mbot.chats[channel.token].close()
          delete mbot.chats[channel.token]
          mbot.db.set('lurks', mbot.lurks.filter(token => token != channel.token))
          mbot.server.send(JSON.stringify({ event: 'lurks', lurks: mbot.lurks }))
          mbot.log.info(`Removed channel ${channel.token} from the lurk list`)
          chat.msg(`Removed ${data.user_name} from our lurk list!`)
        }
      }
    }
  } catch (err) {
    mbot.log.error(err)
  }
})

mbot.addCommandHandler('jointeam', async (chat, data) => {
  let user = await mbot.getUser(data.user_id)
  if ((user) && data.channel == mbot.user.channel.id) {
   mbot.inviteTeamUser(mbot.team.id, {userId: data.user_id})
    chat.msg(`${data.user_name} you have been invited to my Mixer Team!`).catch(err => console.log(err))
  }
})

mbot.server.get('/lurks', (req, res) => {
  if (req.query.html != undefined) return res.render('./lurk.ejs', { data: mbot.conf })
  else return res.send(JSON.stringify(mbot.lurks))
})

mbot.server.on('connection', (client) => {
  client.send(JSON.stringify({ event: 'lurks', lurks: mbot.lurks }))
})

let nextLurk = 0;
lurkStream = async () => {
  const lurks = mbot.utils.chunkify(mbot.lurks, mbot.conf.asyncLurks || 1);
  const lurkCycle = 1000 * (mbot.conf.lurkCycle || 300);
  const lurkTimeout = (mbot.conf.lurkTimeout || 1000)
  if (nextLurk >= lurks.length) {
    nextLurk = 0;
  }
  for (const lurk of lurks[nextLurk]) {
    try {
      const page = await mbot.getPage(`https://mixer.com/${lurk}`);
      page.waitForSelector(".bui-label").then(async () => {
        await page.click(".bui-label");
        await page.click(".accept-btn");
      }).catch(() => {})
      setTimeout(() => page.close(), lurkCycle)
    } catch(err) {
      console.log(err)
    }
  }
  setTimeout(lurkStream, lurkCycle+lurkTimeout)
  nextLurk++;
}
setTimeout(lurkStream, 1000 * 30)