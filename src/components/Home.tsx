import { useState } from 'react';
import IpModal from './IpModal';
import Sidebar from './Sidebar';
import { useBulb } from './BulbContext';
import { Button, Col, Container, FormCheck, FormControl, Row, Spinner } from 'react-bootstrap';
import { FaFloppyDisk, FaLightbulb } from 'react-icons/fa6';
import { FaEdit } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { bulb, setBulb } = useBulb();
  const [isEditActive, setIsEditActive] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { t } = useTranslation();

  const lightSwitchHandler = () => {
    window.electronAPI.toggleBulb();
    setBulb((prev) => {
      return { ...prev, state: !prev.state };
    });
  };

  const handleCloseIpModal = () => {
    setShowIpModal(false);
  };

  const handleChangeName = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((event.target as HTMLInputElement).value === '') return;

    if (event.key === 'Enter') {
      setBulb((prev) => {
        return { ...prev, name: (event.target as HTMLInputElement).value };
      });

      window.electronAPI.setBulbName((event.target as HTMLInputElement).value);
      setIsEditActive(false);
    }
  };

  const bulbElement = () => (
    <Row>
      <Col sm={6} style={{ maxWidth: '20rem' }}>
        <div className="d-flex p-3 justify-content-between gap-3 align-items-center text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold fs-6">
          <FaLightbulb size={35} />
          {isEditActive ? (
            <FormControl
              type="text"
              maxLength={15}
              defaultValue={bulb.name}
              onKeyUp={handleChangeName}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              data-bs-theme="dark"
            />
          ) : (
            <div className="d-flex justify-content-between flex-fill bulb gap-4">
              <span>{bulb.name || bulb.moduleName}</span>
              <FormCheck
                id="lightSwitch"
                type="switch"
                checked={bulb.state}
                onChange={lightSwitchHandler}
              />
            </div>
          )}
        </div>
      </Col>
    </Row>
  );

  const editBtnHandler = () => {
    setIsEditActive((prev) => !prev);
    if (!isEditActive || nameInput === '') {
      return;
    }

    setBulb((prev) => {
      return { ...prev, name: nameInput };
    });

    window.electronAPI.setBulbName(nameInput);
  };

  const searchingForBulbElement = () => (
    <Row>
      <Col sm={6} style={{ maxWidth: '20rem' }}>
        <div className="d-flex p-3 justify-content-between align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
          <FaLightbulb size={35} />
          <div className="d-flex justify-content-between flex-fill bulb align-items-center">
            <span>{t('searchingBulb.search')}</span>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </div>
        <div className="text-white fw-bold mt-3 ms-2 text-xs d-flex align-items-center justify-content-around">
          <span>{t('searchingBulb.notFound')}</span>
          <Button
            className="text-decoration-none add p-0 m-0 border-0"
            variant="link"
            onClick={() => setShowIpModal(true)}
          >
            {t('searchingBulb.manual')}
          </Button>
        </div>
      </Col>
    </Row>
  );

  return (
    <main className="d-flex flex-nowrap bg-main vh-100">
      <Sidebar />
      <Container fluid>
        <Row>
          <Col>
            <h1 className="my-4 d-flex align-items-center justify-content-center">
              <span className="text-white display-6 fw-bold me-2">{t('lightTitle')}</span>
            </h1>
          </Col>
        </Row>
        <Button
          variant="primary"
          className={`edit border-0 rounded-5 mb-3 p-2 px-4 ${
            bulb ? '' : 'visually-hidden'
          } d-flex align-items-center`}
          onClick={editBtnHandler}
        >
          {isEditActive ? <FaFloppyDisk /> : <FaEdit />}
          <span className="ms-1">{isEditActive ? t('SaveChanges') : t('ChangeBulbName')}</span>
        </Button>
        <div className="lights">{bulb ? bulbElement() : searchingForBulbElement()}</div>
      </Container>
      <IpModal show={showIpModal} handleClose={handleCloseIpModal} />
    </main>
  );
}
