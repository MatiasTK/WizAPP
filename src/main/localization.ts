import i18n from '@i18n'
import log from 'electron-log'

const MAX_LOCALE_LENGTH = 2

const initializeLanguage = (app: Electron.App) => {
  let userLanguage = app.getLocale().slice(0, MAX_LOCALE_LENGTH)
  log.info('User language:', userLanguage)
  if (userLanguage !== 'en' && userLanguage !== 'es') {
    userLanguage = 'en'
  }

  i18n.changeLanguage(userLanguage)
  log.info('Changed language to:', userLanguage)
}

export default initializeLanguage
