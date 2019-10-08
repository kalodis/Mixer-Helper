require('fs').readdirSync(__dirname).forEach((file) => {
  try {
    require(`./${file}`)
  } catch(err) {
    mbot.log.error(`Failed to load command file ${file}`, err)
    process.exit()
  }
})