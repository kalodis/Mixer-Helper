const fs = require(`fs`)
const path = require(`path`)

mbot.log = {}

mbot.log.path = path.join(process.cwd(), 'log')

fs.mkdir(mbot.log.path, () => { })

mbot.log._colorize = {
  red: (str) => `\x1b[1m\x1b[31m${str}\x1b[0m`,
  yellow: (str) => `\x1b[1m\x1b[33m${str}\x1b[0m`,
  green: (str) => `\x1b[1m\x1b[32m${str}\x1b[0m`
}

mbot.log._getTimestamp = () => new Date().toISOString().replace(/T/, ` `).replace(/\..+/, ``)

mbot.log._build = (level, context, message) => `${mbot.log._getTimestamp()} ${level} (${context}) ${message}`

mbot.log._insert = (level, data) => {
  try {
    fs.appendFileSync(path.join(mbot.log.path,`${level}.log`), data.concat(`\n`))
  } catch(err) {
    mbot.log.error(`Failed to write log file ${level}.log`, error)
  }
}

mbot.log._concatStack = (message, error, stackOnly) => {
  let log = message
  let start = (message.indexOf('.js)') + 6)
  let prefix = `\n${(new Array(start)).join(' ')}`
  let type = error.constructor.name
  if (!stackOnly) log += `${prefix}${type}: ${error.message}`
  if (typeof error.stack === 'string') {
    error.stack = error.stack.split('\n').filter(s => s.includes(' at ')).map(s => s.trim().replace('at ', ''))
  }
  prefix = `\n${(new Array(start+4)).join(' ')}at `
  log += `${prefix}${error.stack.join(prefix)}`
  return log
}

mbot.log._getCallerFileName = () => {
  try {
    let err = new Error()
    let callerfile
    let currentfile

    Error.prepareStackTrace = (err, stack) => stack

    currentfile = err.stack.shift().getFileName()

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName()
      if (currentfile !== callerfile) return path.basename(callerfile)
    }
  } catch (err) {}

  return undefined
}

mbot.log.log = (level, msg, error) => {
  let message = mbot.log._build(
    `[${level.toUpperCase()}]`,
    mbot.log._getCallerFileName(),
    msg
  )

  if (msg.stack && msg.message) message = mbot.log._concatStack(message, msg, true)
  else if (error) message = mbot.log._concatStack(message, error)

  mbot.log._insert(level, message)

  switch (level) {
    case 'success': 
      message = mbot.log._colorize.green(message)
      break
    case 'warning': 
      message = mbot.log._colorize.yellow(message)
      break
    case 'error': 
      message = mbot.log._colorize.red(message)
      break
  }

  console.log(message)
}

mbot.log.info = (str, err) => mbot.log.log('info', str, err)
mbot.log.success = (str, err) => mbot.log.log('success', str, err)
mbot.log.warning = (str, err) => mbot.log.log('warning', str, err)
mbot.log.error = (str, err) => mbot.log.log('error', str, err)