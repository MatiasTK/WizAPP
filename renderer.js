function getLight() {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((event, res) => {
    console.log(res);
    if (res) {
      document.querySelector('.lights').innerHTML = `
      <div class="row">
      <div class="col-sm-4 w-50">
      <div class="d-flex p-2 align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
        <div class="rounded rounded-circle p-3">
            <i class="fa-solid fa-lightbulb fa-2xl"></i>
        </div>
        <div class="d-flex justify-content-between flex-fill">
            <span>${res.moduleName}</span>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="lightSwitch" ${
                  res.state ? 'checked' : ''
                }>
                <label class="form-check-label" for="lightSwitch"></label>
            </div>
        </div>
    </div>
    </div>
    </div>`;
    }
    toggleSwitch('lightSwitch');
  });
}

function toggleSwitch(switchName) {
  const switchBtn = document.getElementById(switchName);
  switchBtn.addEventListener('change', () => {
    const lights = document.querySelector('.lights');
    window.electronAPI.toggleBulb();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  getLight();
  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
});
