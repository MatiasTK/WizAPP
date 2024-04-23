import { useState } from 'react';

export default function IpModal() {
  const [value, setValue] = useState<string>('');

  const setIpHandler = () => {
    window.electronAPI.setIp(value);
  };

  return (
    <div
      className="modal fade"
      id="addModal"
      tabIndex={-1}
      aria-labelledby="addModalLabel"
      aria-hidden="true"
      data-bs-theme="dark"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-white">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="addModalLabel">
              Add a Bulb
            </h1>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form className="needs-validation" onSubmit={setIpHandler}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="ip" className="form-label">
                  IP
                </label>
                <input
                  type="text"
                  className="form-control ipInput"
                  id="ip"
                  aria-describedby="ipHelp"
                  autoFocus
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <div className="valid-feedback">Looks good!</div>
                <div className="invalid-feedback">Please provide a valid IP.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
              <button type="submit" className="btn btn-primary ipBtn">
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
