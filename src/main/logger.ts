import log from 'electron-log'

const initializeLogger = () => {
  log.initialize()
  log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s},{ms} [{level}] {text}'
  log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s},{ms} [{level}] {text}'
  log.transports.file.fileName = 'wiz-app.log'

  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error)
  })
}

export default initializeLogger
