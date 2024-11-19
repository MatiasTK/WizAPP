import { Col, Container, Row } from 'react-bootstrap';
import { useBulb } from '@context/BulbContext';
import Sidebar from '@components/Sidebar';
import { FaLightbulb } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

export default function Devices() {
  const { bulb } = useBulb();
  const { t } = useTranslation();

  return (
    <main className="d-flex flex-nowrap bg-main vh-100">
      <Sidebar />
      <Container fluid className="flex-grow-1">
        <Row>
          <Col>
            <h1 className="d-flex justify-content-center align-items-center mt-4 ms-4">
              <span className="text-white display-6 fw-bold">{t('device.title')}</span>
            </h1>
            <hr />
          </Col>
        </Row>
        <div className="info text-white d-flex">
          {bulb ? (
            <div className="d-flex flex-column bg-primary bg-opacity-50 rounded p-3 ms-4 border border-3 border-primary">
              <FaLightbulb size={60} className="my-4 ms-auto me-auto" />
              <span>
                <strong>{t('device.moduleName')}:</strong> {bulb.moduleName}
              </span>
              <span>
                <strong>{t('device.ipAddress')}:</strong> {bulb.ip}
              </span>
              <span>
                <strong>{t('device.port')}:</strong> {bulb.port}
              </span>
              <span>
                <strong>{t('device.macAddress')}:</strong> {bulb.mac}
              </span>
              <span>
                <strong>{t('device.status')}:</strong> {bulb.state ? 'ON' : 'OFF'}
              </span>
              <span>
                <strong>{t('device.sceneId')}:</strong> {bulb.sceneId}
              </span>
              <span>
                {bulb.dimming ? (
                  <span>
                    <strong>{t('device.brightness')}: </strong>
                    {`${bulb.dimming}%`}
                  </span>
                ) : (
                  ''
                )}
              </span>
              <span>
                <strong>{t('device.firmwareVersion')}:</strong> {bulb.fwVersion}
              </span>
              <span>
                <strong>{t('device.homeId')}:</strong> {bulb.homeId}
              </span>
              <span>
                <strong>{t('device.roomId')}:</strong> {bulb.roomId}
              </span>
            </div>
          ) : (
            ''
          )}
        </div>
      </Container>
    </main>
  );
}
