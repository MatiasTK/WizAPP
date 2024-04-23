import logo from '../assets/logo_sidebar.png';
import { memo, useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { useBulb } from './BulbContext';

function Sidebar() {
  const { bulb, setBulb } = useBulb();
  const [isDragging, setIsDragging] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const renderItem = (label: string, faIcon: string, ref: string) => (
    <li className="nav-item">
      <Link className={`nav-link ${useMatch(ref) ? 'active' : ''} fw-b text-white`} to={ref}>
        <i className={`fa-regular ${faIcon}`}></i>
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
        <i className="fa-solid fa-moon"></i>
        <input
          type="range"
          className="form-range"
          id="customRange1"
          min="10"
          max="100"
          step="5"
          onChange={brightnessHandler}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          defaultValue={bulb.dimming}
        />
        <i className="fa-solid fa-sun"></i>
      </div>
      <div className="d-flex gap-2 align-items-center justify-content-between w-100 text-white fw-bold p-2">
        <span className="sidebar-nombre">{bulb.name || bulb.moduleName}</span>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="lightSwitch-main"
            checked={bulb.state}
            onChange={lightSwitchHandler}
          />
          <label className="form-check-label" htmlFor="lightSwitch-main"></label>
        </div>
      </div>
    </div>
  );

  const visitAuthorHandler = () => window.electronAPI.visitAuthor();
  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark sidebar-w">
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
        {renderItem('Lights', 'fa-lightbulb', '/')}
        {renderItem('Scenes', 'fa-image', '/scenes')}
        {renderItem('Devices', 'fa-circle-question', '/devices')}
      </ul>
      {bulb ? renderShortcut() : null}
      <hr />
      <span className="text-center">
        Made by{' '}
        <a className="redirect" style={{ cursor: 'pointer' }} onClick={visitAuthorHandler}>
          MatiasTK
        </a>
      </span>
    </div>
  );
}

export default memo(Sidebar);
