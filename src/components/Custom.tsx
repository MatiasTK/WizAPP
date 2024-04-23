import { useState } from 'react';
import { BulbState } from '../types';
import { useBulb } from './BulbContext';
import ModalCreateColor from './ModalCreateColor';
import ModalEditColor from './ModalEditColor';

export default function Custom() {
  const { bulb, setBulb } = useBulb();

  const [currentEditColor, setCurrentEditColor] = useState<BulbState['customColors'][0]>();

  const setCustomColorHandler = (id: number) => {
    setBulb((prev) => {
      return { ...prev, sceneId: id, state: true };
    });
    window.electronAPI.setCustomColor(id);
  };

  const renderCustomColor = (color: BulbState['customColors'][0]) => (
    <div className="col d-flex" key={color.id}>
      <button
        className={`d-flex justify-content-between align-items-center rounded-4 rounded-end-0 scene-button p-4 w-100 border-0 bg-secondary bg-opacity-25 ${
          bulb.sceneId === color.id ? 'active' : ''
        }`}
        data-sceneid={color.id}
        onClick={() => setCustomColorHandler(color.id)}
      >
        <a className="text-decoration-none d-flex flex-row align-items-center">
          <span className="dot" style={{ backgroundColor: color.hex }}></span>
          <span className="fw-bold text-nowrap ms-2 text-white">{color.name}</span>
        </a>
      </button>
      <button
        className={`scene-button bg-secondary bg-opacity-25 border-0 rounded-end-4 px-2 edit-color  ${
          bulb.sceneId === color.id ? 'active' : ''
        } `}
        data-bs-toggle="modal"
        data-bs-target="#editColor"
        onClick={() => setCurrentEditColor(color)}
      >
        <i className="fa-solid fa-pencil text-white fa-lg edit-color"></i>
      </button>
    </div>
  );

  return (
    <>
      <ModalCreateColor />
      <ModalEditColor currentEditColor={currentEditColor} />
      <div className="ms-3 d-flex flex-column">
        <div className="my-auto">
          <div className="d-flex align-items-center mb-4 ms-4">
            <h2 className="text-white mb-0">Custom Colors</h2>
            <button
              type="button"
              className="btn btn-primary ms-3 text-white rounded-5 border-0 px-4 py-2"
              data-bs-toggle="modal"
              data-bs-target="#newColor"
              disabled={!bulb}
            >
              <a className="text-decoration-none d-flex flex-row text-white justify-content-center align-items-center">
                <i className="fa-solid fa-plus fa-lg me-1"></i>
                <span className="text-nowrap fw-semibold">New</span>
              </a>
            </button>
          </div>
          <div className="row row-cols-3 row-cols-lg-4 row-cols-xl-5 row-gap-3 custom-colors">
            {bulb &&
              bulb.customColors &&
              bulb.customColors.map((color) => renderCustomColor(color))}
          </div>
        </div>
      </div>
    </>
  );
}
