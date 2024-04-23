import { useBulb } from './BulbContext';
import { BulbState } from '../types';
import { useEffect, useState } from 'react';

interface ModalEditColorProps {
  currentEditColor: BulbState['customColors'][0];
}

export default function ModalEditColor({ currentEditColor }: ModalEditColorProps) {
  const { setBulb } = useBulb();

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#ffffff');

  useEffect(() => {
    if (!currentEditColor) return;

    setColorName(currentEditColor.name);
    setColorHex(currentEditColor.hex);
  }, [currentEditColor]);

  const editColorHandler = (e: React.FormEvent) => {
    e.preventDefault();
    setBulb((prev) => {
      return {
        ...prev,
        customColors: prev.customColors.map((color) =>
          color.id === currentEditColor.id ? { ...color, name: colorName, hex: colorHex } : color
        ),
      };
    });
    window.electronAPI.editCustomColor(currentEditColor.id, colorName, colorHex);
  };

  const removeColorHandler = () => {
    setBulb((prev) => {
      return {
        ...prev,
        customColors: prev.customColors.filter((color) => color.id !== currentEditColor.id),
      };
    });
    window.electronAPI.removeCustomColor(currentEditColor.id);
  };

  return (
    <div
      className="modal fade text-white"
      id="editColor"
      tabIndex={-1}
      aria-labelledby="editColorLabel"
      aria-hidden="true"
      data-bs-theme="dark"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="editColorLabel">
              Edit Color
            </h1>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form className="edit-color-form" onSubmit={editColorHandler}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="colorEdit" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="colorEdit"
                  maxLength={20}
                  minLength={1}
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g Red"
                />
                <label htmlFor="colorEditInput" className="mt-2">
                  Pick a color:
                </label>
                <input
                  type="color"
                  className="form-control form-control-color mt-2 w-100"
                  id="colorEditInput"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  title="Choose your color"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger remove-color"
                data-bs-dismiss="modal"
                onClick={removeColorHandler}
              >
                <i className="fa-solid fa-trash-can"></i>
                <span className="ms-1">Remove</span>
              </button>
              <button type="submit" data-bs-dismiss="modal" className="btn btn-primary">
                <i className="fa-solid fa-floppy-disk"></i>
                <span className="ms-1">Save changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
