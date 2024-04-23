import { useState } from 'react';
import { useBulb } from './BulbContext';

export default function ModalCreateColor() {
  const { setBulb } = useBulb();

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#ffffff');

  const addNewColorHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName || !colorHex) return;

    window.electronAPI.addCustomColor(colorName, colorHex);
    setBulb((prev) => {
      return {
        ...prev,
        customColors: [
          ...prev.customColors,
          {
            id:
              prev.customColors.length === 0
                ? 33
                : prev.customColors[prev.customColors.length - 1].id + 1,
            name: colorName,
            hex: colorHex,
          },
        ],
      };
    });

    setColorName('');
    setColorHex('#ffffff');
  };

  return (
    <div
      className="modal fade text-white"
      id="newColor"
      tabIndex={-1}
      aria-labelledby="newColorLabel"
      aria-hidden="true"
      data-bs-theme="dark"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="newColorLabel">
              Add a new custom color
            </h1>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form className="new-color-form" onSubmit={addNewColorHandler}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="colorName" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="colorName"
                  maxLength={20}
                  minLength={1}
                  placeholder="e.g Red"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                />
                <label htmlFor="colorInput" className="mt-2">
                  Pick a color:
                </label>
                <input
                  type="color"
                  className="form-control form-control-color mt-2 w-100"
                  id="colorInput"
                  value="#ffffff"
                  title="Choose your color"
                  defaultValue={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" data-bs-dismiss="modal">
                Close
              </button>
              <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
