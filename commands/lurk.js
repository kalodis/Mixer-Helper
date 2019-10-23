let globalLurks = []
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
      mbot.log.info('\x1b[32m%s\x1b[0m', `[L4L] Connecting to ${token}'s channel.`);
    } else {
      mbot.log.info('\x1b[32m%s\x1b[0m', `[L4L] Already connected to ${token}'s channel!`);
    }
  }
}
request.get('https://mixer-helper.s3.amazonaws.com/lurks.json', (err, res, body) => {
    if (!err && res.statusCode == 200) {
        globalLurks = JSON.parse(body);
        mbot.lurks.push(...globalLurks)
    } else mbot.log.warn("Failed to get global lurk list")
    mbot.lurks = Array.from(new Set(mbot.lurks))
    connectToLurks()
})

messageLurks = async () => {
  if (lurkOn) {
    for (let token of mbot.lurks) {
      let channel = await mbot.getChannel(token)
      let message = lurkMessages[Math.floor(Math.random()*lurkMessages.length)]
      if (channel.online && token != mbot.user.channel.token) {
        try {
          mbot.chats[token].msg(message)
        } catch (err) {
          let uchat = await mbot.getChat(channel.id)
          let chat = await mbot.join(channel, uchat)
          chat.msg(message).catch(err => console.log(err))
        }
        mbot.log.info(`[L4L] Sent "${message}" to Channel ${token}!`)
      } else mbot.log.info(`[L4L] Channel ${token} is offline - No lurk message sent!`)
      if (mbot.lurks.length >= 1000) await mbot.delay(3500)
    }
  }
}
setInterval(messageLurks, 1000 * 60 * lurkInterval)

mbot.addCommandHandler('lurkon', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      lurkOn = true
      console.log(`Lurk messages have been enabled!`)
    }
  }
})

mbot.addCommandHandler('lurkoff', async (chat, data, args) => {
  if (data.channel == mbot.user.channel.id) {
    if (data.user_id === mbot.user.id) {
      lurkOn = false
      console.log(`Lurk messages have been disabled!`)
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
            console.log('\x1b[36m%s\x1b[0m', `[L4L] Added channel ${user.channel.token} to lurk list!`);
            chat.msg(`@${user.channel.token}'s channel has been added to our lurk list!`).catch(err => console.log(err))
            mbot.db.set('lurks')
          } else console.log('\x1b[36m%s\x1b[0m', `[L4L] Channel ${user.channel.token} already added to lurk list!`);
          if (!mbot.chats[user.channel.token]) {
            await mbot.join(user.channel, uchat)
          } else {
            chat.msg(`@${user.channel.token}'s channel is already on my lurk list! `).catch(err => console.log(err))
            console.log('\x1b[36m%s\x1b[0m', `Already Lurking ${user.channel.token}'s channel!`);
          }
        } else {
          console.log('\x1b[31m%s\x1b[0m', `[L4L] Channel ${user.channel.token} doesn't exist`);
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
  if (mbot.team && user && data.channel == mbot.user.channel.id && data.user_id != mbot.user.id) {
   mbot.inviteTeamUser(mbot.team.id, {userId: data.user_id})
    chat.msg(`${data.user_name} you have been invited to my Mixer Team!`).catch(err => console.log(err))
  }
})

mbot.server.get('/lurks', (req, res) => {
  if (req.query.html != undefined) return res.render('./lurk.ejs', { data: mbot.conf })
  else return res.send(JSON.stringify(mbot.lurks))
})

mbot.server.on('connection', (client) => {
  client.send(JSON.stringify({ event: 'lurks', lurks: mbot.lurks })).catch(err => console.log(err))
})

let nextLocalLurk = 0;
let nextGlobalLurk = 0;
lurkStream = async () => {
  const chunk =  Math.max(1,mbot.conf.asyncLurks/2)
  const lurks = mbot.utils.chunkify(mbot.lurks.filter((l) => !globalLurks.includes(l)), Math.floor(chunk));
  const glurks = mbot.utils.chunkify(mbot.lurks.filter((l) => globalLurks.includes(l)), Math.ceil(chunk));
  const lurkCycle = 1000 * (mbot.conf.lurkCycle);
  const lurkTimeout = 1000 * (mbot.conf.lurkTimeout);
  const lurkChannels = async (channels=[]) => {
    for (const token of channels) {
      let channel = await mbot.getChannel(token)
      if (channel.online) {
        try {
          const page = await mbot.getPage(`https://mixer.com/${token}`);
          page.waitForSelector(".bui-label").then(async () => {
            await page.click(".bui-label");
            await page.click(".accept-btn");
          }).catch(() => {})
          setTimeout(() => page.close(), lurkCycle)
        } catch(err){
          console.log(err)
        }
      }
    }
  }
  if (nextLocalLurk >= lurks.length) {
    nextLocalLurk = 0;
  }
  if (nextGlobalLurk >= glurks.length) {
    nextGlobalLurk = 0;
  }
  await lurkChannels(lurks[nextLocalLurk++])
  await lurkChannels(glurks[nextGlobalLurk++])
  setTimeout(lurkStream, lurkCycle+lurkTimeout)
}
setTimeout(lurkStream, 1000 * 30)