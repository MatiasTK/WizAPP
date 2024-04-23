import { useState } from 'react';
import IpModal from './IpModal';
import Sidebar from './Sidebar';
import { useBulb } from './BulbContext';

export default function Home() {
  const { bulb, setBulb } = useBulb();
  const [isEditActive, setIsEditActive] = useState(false);

  const lightSwitchHandler = () => {
    window.electronAPI.toggleBulb();
    setBulb((prev) => {
      return { ...prev, state: !prev.state };
    });
  };

  const handleChangeName = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setBulb((prev) => {
        return { ...prev, name: (event.target as HTMLInputElement).value };
      });

      window.electronAPI.setBulbName((event.target as HTMLInputElement).value);
      setIsEditActive(false);
    }
  };

  const bulbElement = () => (
    <div className="row">
      <div className="col-sm-4 w-50">
        <div className="d-flex p-2 align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
          <div className="rounded rounded-circle p-3">
            <i className="fa-solid fa-lightbulb fa-2xl"></i>
          </div>
          {isEditActive ? (
            <div className="d-flex justify-content-between flex-fill bulb">
              <input
                type="text"
                className="inputEdit"
                maxLength={15}
                defaultValue={bulb.name}
                onKeyUp={handleChangeName}
              />
            </div>
          ) : (
            <div className="d-flex justify-content-between flex-fill bulb">
              <span>{bulb.name || bulb.moduleName}</span>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="lightSwitch"
                  checked={bulb.state}
                  onChange={lightSwitchHandler}
                />
                <label className="form-check-label" htmlFor="lightSwitch"></label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const editBtnHandler = () => {
    setIsEditActive((prev) => !prev);
  };

  const searchingForBulbElement = () => (
    <div className="row">
      <div className="col-sm-4 w-50">
        <div className="d-flex p-2 align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
          <div className="rounded rounded-circle p-3">
            <i className="fa-solid fa-lightbulb fa-2xl"></i>
          </div>
          <div className="d-flex justify-content-between flex-fill bulb align-items-center">
            <span>Searching bulb...</span>
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <p className="text-white fw-bold mt-3 ms-2 text-xs">
          Can't find bulb?
          <button
            className="fw-normal link-primary text-decoration-none border-0  bg-transparent add"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#addModal"
          >
            Add it manually
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <main className="d-flex flex-nowrap bg-main vh-100">
      <Sidebar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="my-4 d-flex align-items-center justify-content-center">
              <span className="text-white display-6 fw-bold me-2">Lights</span>
            </div>
          </div>
        </div>
        <button
          className={`edit bg-primary border-0 rounded-5 mb-3 p-2 px-4 ${
            bulb ? '' : 'visually-hidden'
          }`}
          onClick={editBtnHandler}
        >
          <i className={`fa-solid ${isEditActive ? 'fa-floppy-disk' : 'fa-pencil'} fa`}></i>
          <span className="ms-1">{isEditActive ? 'Save Changes' : 'Change Name'}</span>
        </button>
        <div className="lights">{bulb ? bulbElement() : searchingForBulbElement()}</div>
      </div>
      <IpModal />
    </main>
  );
}
