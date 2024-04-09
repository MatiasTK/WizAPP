let shortcutCreated = false;

function addSwitchToggleToSidebar(res) {
  if (shortcutCreated) return;

  const shortcut = document.querySelector('.shortcut');
  const slider = document.querySelector('.form-range');

  const div = document.createElement('div');
  div.innerHTML = `
  <span>${res.name}</span>
  <div class="form-check form-switch mt-1">
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
    'justify-content-around',
    'w-100',
    'text-white',
    'fw-bold',
    'p-2'
  );

  shortcut.appendChild(div);

  slider.disabled = false;
  slider.value = res.dimming;
  shortcutCreated = true;

  slider.addEventListener('change', (e) => {
    window.electronAPI.setBrightness(e.target.value);
  });

  const switchBtn = document.getElementById('lightSwitch');
  switchBtn.addEventListener('change', () => {
    window.electronAPI.toggleBulb();
  });
}

const getActiveScene = () => {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((_event, res) => {
    if (!res) {
      return;
    }
    const scenes = document.querySelectorAll('.scene-button');

    scenes.forEach((scene) => {
      scene.removeAttribute('disabled');
      if (parseInt(scene.dataset.sceneid, 10) === res.sceneId) {
        scene.classList.add('active');
      }
    });

    addSwitchToggleToSidebar(res);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  getActiveScene();
  const scenes = document.querySelectorAll('.scene-button');

  scenes.forEach((scene) => {
    scene.addEventListener('click', () => {
      scenes.forEach((curScene) => {
        curScene.classList.remove('active');
      });
      const sceneId = scene.dataset.sceneid;
      window.electronAPI.setScene(sceneId);
      getActiveScene();
    });
  });

  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
});
