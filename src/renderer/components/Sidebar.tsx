import logo from '@assets/logo_sidebar.png';
import { useBulb } from '@context/BulbContext';
import { ReactNode, memo, useEffect, useState } from 'react';
import { FaCircleQuestion, FaImage, FaLightbulb } from 'react-icons/fa6';
import { Link, useMatch } from 'react-router-dom';

import { Form, FormCheck } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { MdBrightness5, MdBrightness7 } from 'react-icons/md';

function Sidebar() {
  const { bulb, setBulb } = useBulb();
  const [isDragging, setIsDragging] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const { t } = useTranslation();
  const [version, setVersion] = useState<string>(() => {
    return sessionStorage.getItem('version') || '';
  });

  useEffect(() => {
    if (!version) {
      window.electronAPI.getVersion().then((version: string) => {
        sessionStorage.setItem('version', version);
        setVersion(version);
      });
    }
  }, []);

  const renderItem = (label: string, faIcon: ReactNode, ref: string) => (
    <li className="nav-item">
      <Link
        className={`nav-link ${
          useMatch(ref) ? 'active' : ''
        } fw-b text-white d-flex align-items-center gap-1`}
        to={ref}
      >
        {faIcon}
        <span className="ms-1 text-white text-decoration-none">{label}</span>
      </Link>
    </li>
  );

  const brightnessHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(parseInt(event.target.value));
  };

  const lightSwitchHandler = () => {
    window.electronAPI.toggleBulb();
    setBulb((prev) => {
      return { ...prev, state: !prev.state };
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      window.electronAPI.setBrightness(brightness);
      setIsDragging(false);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const renderShortcut = () => (
    <div className="d-flex align-items-center flex-column-reverse gap-2 p-2 rounded justify-content-between shortcut">
      <div className="d-flex align-items-center gap-2">
        <MdBrightness5 size={25} />
        <Form.Range
          min={10}
          max={100}
          step={5}
          onChange={brightnessHandler}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          defaultValue={bulb.dimming}
        />
        <MdBrightness7 size={25} />
      </div>
      <div className="d-flex gap-2 align-items-center justify-content-between w-100 text-white fw-bold p-2">
        <span className="sidebar-nombre">{bulb.name || bulb.moduleName}</span>
        <FormCheck
          id="lightSwitch"
          type="switch"
          checked={bulb.state}
          onChange={lightSwitchHandler}
        />
      </div>
    </div>
  );

  const visitAuthorHandler = () => window.electronAPI.visitAuthor();
  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark sidebar-w pb-1">
      <a
        href="#"
        className="d-flex align-items-center justify-content-center mb-3 mb-md-0 fw-bold text-decoration-none"
      >
        <img
          src={logo}
          alt="Wiz logo"
          className="img-fluid sidebar-image"
          height="40px"
          width="80px"
        />
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {renderItem(t('lightTitle'), <FaLightbulb size={20} />, '/')}
        {renderItem(t('Scenes'), <FaImage size={20} />, '/scenes')}
        {renderItem(t('Devices'), <FaCircleQuestion size={20} />, '/devices')}
      </ul>
      {bulb ? renderShortcut() : null}
      <hr />
      <div className="text-center">
        {t('MadeBy')}
        <a className="redirect" style={{ cursor: 'pointer' }} onClick={visitAuthorHandler}>
          MatiasTK
        </a>
        <p className="small">
          Version: <span className="fw-bold">{version}</span>
        </p>
      </div>
    </div>
  );
}

export default memo(Sidebar);
