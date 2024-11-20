import i18n from '@i18n/index';

const MAX_LOCALE_LENGTH = 2;

const initializeLanguage = (app: Electron.App) => {
  let userLanguage = app.getLocale().slice(0, MAX_LOCALE_LENGTH);
  if (userLanguage !== 'en' && userLanguage !== 'es') {
    userLanguage = 'en';
  }

  i18n.changeLanguage(userLanguage);
};

export default initializeLanguage;
