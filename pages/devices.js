function getLight() {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((_event, res) => {
    console.log(res);
    document.querySelector('.info').innerHTML = `
        <div class="d-flex flex-column bg-primary bg-opacity-50 rounded p-3 ms-4 border border-3 border-primary">
            <i class="fa-regular fa-lightbulb text-center fa-2xl my-5"></i>
            <span>Module Name: ${res.moduleName}</span>
            <span>Mac Address: ${res.mac}</span>
            <span>Status: ${res.state ? 'ON' : 'OFF'}</span>
            <span>Scene Id: ${res.sceneId}</span>
            ${res.dimming ? `<span>Brightness: ${res.dimming}%</span>` : ''}
            <span>Firmware Version: ${res.fwVersion}</span>
            <span>Home ID: ${res.homeId}</span>
            <span>Room ID: ${res.roomId}</span>
        </div>
        `;
  });
}

window.addEventListener('DOMContentLoaded', () => {
  getLight();
  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
});
