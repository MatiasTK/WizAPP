function addSwitchToggleToSidebar(res) {
  const shortcut = document.querySelector('.shortcut');

  const div = document.createElement('div');
  div.innerHTML = `
  <span>${res.name || res.moduleName}</span>
  <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" id="lightSwitch" ${
        res.state ? 'checked' : ''
      }>
      <label class="form-check-label" for="lightSwitch"></label>
  </div>
  `;

  div.classList.add(
    'd-flex',
    'gap-2',
    'align-items-center',
    'justify-content-between',
    'w-100',
    'text-white',
    'fw-bold',
    'p-2'
  );

  shortcut.appendChild(div);

  const slider = document.querySelector('.form-range');
  slider.disabled = false;
  slider.value = res.dimming;

  slider.addEventListener('change', (e) => {
    window.electronAPI.setBrightness(e.target.value);
  });

  const switchBtn = document.getElementById('lightSwitch');
  switchBtn.addEventListener('change', () => {
    window.electronAPI.toggleBulb();
  });
}

function getLight() {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((_event, res) => {
    document.querySelector('.info').innerHTML = `
        <div class="d-flex flex-column bg-primary bg-opacity-50 rounded p-3 ms-4 border border-3 border-primary">
            <i class="fa-regular fa-lightbulb text-center fa-2xl my-5"></i>
            <span>Module Name: ${res.moduleName}</span>
            <span>IP Address: ${res.ip}</span>
            <span>Port: ${res.port}</span>
            <span>Mac Address: ${res.mac}</span>
            <span>Status: ${res.state ? 'ON' : 'OFF'}</span>
            <span>Scene Id: ${res.sceneId}</span>
            ${res.dimming ? `<span>Brightness: ${res.dimming}%</span>` : ''}
            <span>Firmware Version: ${res.fwVersion}</span>
            <span>Home ID: ${res.homeId}</span>
            <span>Room ID: ${res.roomId}</span>
        </div>
        `;
    addSwitchToggleToSidebar(res);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  getLight();
  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
});
