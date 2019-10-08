require('fs').readdirSync(__dirname).forEach((file) => {
  try {
    require(`./${file}`)
  } catch (err) {
    if (mbot.log.error) mbot.log.error(`Failed to load module file ${file}`, err)
    else console.error(`Failed to load module file ${file}\n`, err)
    process.exit()
  }
})