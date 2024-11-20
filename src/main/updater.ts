import { dialog, net, shell } from 'electron';
import { RELEASE_URL } from '@constants/index';
import i18n from '@i18n/index';
import log from 'electron-log';

function isVersionLessThan(a: string, b: string): boolean {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < partsA.length; i++) {
    if (partsA[i] < partsB[i]) {
      return true;
    } else if (partsA[i] > partsB[i]) {
      return false;
    }
  }

  return false;
}

const checkForUpdates = (app: Electron.App): void => {
  log.info('Checking for updates...');
  log.info('CURRENT VERSION:', app.getVersion());
  const request = net.request(RELEASE_URL);
  request.on('response', (response) => {
    response.on('data', (data) => {
      const release = JSON.parse(data.toString());
      const latestVersion = release.tag_name.replace('v', '');
      log.info('LATEST RELEASE:', release.tag_name);

      if (isVersionLessThan(app.getVersion(), latestVersion)) {
        log.info('UPDATE AVAILABLE!');
        dialog
          .showMessageBox({
            title: i18n.t('updateDialog.title'),
            type: 'info',
            message: `${i18n.t('updateDialog.message')} ${latestVersion}?`,
            buttons: ['Yes', 'No'],
          })
          .then((res) => {
            if (res.response === 0) {
              shell.openExternal(release.html_url);
            }
          });
      }
    });
  });
  request.end();
};

export default checkForUpdates;
