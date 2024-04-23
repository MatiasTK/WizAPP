import { useBulb } from './BulbContext';
import Sidebar from './Sidebar';

export default function Devices() {
  const { bulb } = useBulb();

  return (
    <main className="d-flex flex-nowrap bg-main vh-100">
      <Sidebar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center align-items-center mt-4 ms-4">
              <span className="text-white display-6 fw-bold">Device Info</span>
            </div>
            <hr />
          </div>
        </div>
        <div className="info text-white d-flex">
          {bulb ? (
            <div className="d-flex flex-column bg-primary bg-opacity-50 rounded p-3 ms-4 border border-3 border-primary">
              <i className="fa-regular fa-lightbulb text-center fa-2xl my-5"></i>
              <span>Module Name: {bulb.moduleName}</span>
              <span>IP Address: {bulb.ip}</span>
              <span>Port: {bulb.port}</span>
              <span>Mac Address: {bulb.mac}</span>
              <span>Status: {bulb.state ? 'ON' : 'OFF'}</span>
              <span>Scene Id: {bulb.sceneId}</span>
              {bulb.dimming ? `<span>Brightness: ${bulb.dimming}%</span>` : ''}
              <span>Firmware Version: {bulb.fwVersion}</span>
              <span>Home ID: {bulb.homeId}</span>
              <span>Room ID: {bulb.roomId}</span>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </main>
  );
}
