let shortcutCreated = false;

function addSwitchToggleToSidebar(res) {
  if (shortcutCreated) return;

  const shortcut = document.querySelector('.shortcut');
  const slider = document.querySelector('.form-range');

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

function addCustomColorHandler() {
  const colorName = document.getElementById('colorName').value;
  const colorInput = document.getElementById('colorInput').value;
  if (!colorName || !colorInput) return;
  window.electronAPI.addCustomColor(colorName, colorInput);
  window.electronAPI.bulbStateRequest();
  getActiveScene();
}

let customColorsCreated = false;
function addCustomColor() {
  if (customColorsCreated) return;
  customColorsCreated = true;

  const customColors = document.querySelector('.custom-colors');
  window.electronAPI.bulbStateResponse((_event, res) => {
    if (!res || !res.customColors) {
      return;
    }

    res.customColors.forEach((color) => {
      const div = document.createElement('div');
      div.innerHTML = `
      <div class="col d-flex">
          <button
            class="d-flex justify-content-between align-items-center rounded-4 rounded-end-0 scene-button p-4 w-100 border-0 bg-secondary bg-opacity-25 ${
              res.sceneId === color.id ? 'active' : ''
            }"
            data-sceneId="${color.id}"
          >
            <a class="text-decoration-none d-flex flex-row align-items-center">
              <span class="dot" style="background-color: ${color.hex}"></span>
              <span class="fw-bold text-nowrap ms-2 text-white">${color.name}</span>
            </a>

          </button>
          <button class="scene-button bg-secondary bg-opacity-25 border-0 rounded-end-4 px-2 edit-color  ${
            res.sceneId === color.id ? 'active' : ''
          } " data-bs-toggle="modal"
          data-bs-target="#editColor">
            <i class="fa-solid fa-pencil text-white fa-lg edit-color"></i>
          </button>
        </div>
      `;

      div.classList.add('d-flex', 'gap-2', 'align-items-center', 'text-white', 'fw-bold', 'p-2');
      customColors.appendChild(div);

      const editBtn = div.querySelector('.edit-color');
      editBtn.addEventListener('click', () => {
        const colorName = document.getElementById('colorEdit');
        const colorInput = document.getElementById('colorEditInput');
        colorName.value = color.name;
        colorInput.value = color.hex;
      });

      const editColorForm = document.querySelector('.edit-color-form');
      editColorForm.addEventListener('submit', () => {
        const colorName = document.getElementById('colorEdit').value;
        const colorInput = document.getElementById('colorEditInput').value;
        window.electronAPI.editColor(color.id, colorName, colorInput);
        window.electronAPI.bulbStateRequest();
        getActiveScene();
      });

      const removeColorBtn = document.querySelector('.remove-color');
      removeColorBtn.addEventListener('click', () => {
        div.remove();
        window.electronAPI.removeColor(color.id);
        window.electronAPI.bulbStateRequest();
        getActiveScene();
      });

      const colorBtn = div.querySelector('.scene-button');
      colorBtn.addEventListener('click', () => {
        const activeScene = document.querySelectorAll('button.active');
        activeScene.forEach((scene) => {
          scene.classList.remove('active');
        });
        colorBtn.classList.add('active');
        const switchBtn = document.getElementById('lightSwitch');
        switchBtn.checked = true;
        window.electronAPI.setCustomColor(color.id);
      });
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  getActiveScene();
  addCustomColor(customColorsCreated);
  const scenes = document.querySelectorAll('.scene-button');

  scenes.forEach((scene) => {
    scene.addEventListener('click', () => {
      const activeScene = document.querySelector('button.active');
      if (activeScene) activeScene.classList.remove('active');
      const sceneId = scene.dataset.sceneid;

      window.electronAPI.setScene(sceneId);

      getActiveScene();
      const switchBtn = document.getElementById('lightSwitch');
      switchBtn.checked = true;
    });
  });

  const newColorForm = document.querySelector('.new-color-form');
  newColorForm.addEventListener('submit', () => {
    addCustomColorHandler();
  });

  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
});
