import { BulbState } from './types';

function toggleSwitch() {
  const switchBtn = document.getElementById('lightSwitch') as HTMLInputElement;
  const switchBtnMain = document.getElementById('lightSwitch-main') as HTMLInputElement;
  switchBtn.addEventListener('change', () => {
    //window.electronAPI.toggleBulb();
    switchBtnMain.checked = !switchBtnMain.checked;
  });
  switchBtnMain.addEventListener('change', () => {
    //window.electronAPI.toggleBulb();
    switchBtn.checked = !switchBtn.checked;
  });
}

let shortcutCreated = false;
function addSwitchToggleToSidebar(res: BulbState) {
  if (shortcutCreated) return;
  const shortcut = document.querySelector('.shortcut');

  const div = document.createElement('div');
  div.innerHTML = `
      <span class="sidebar-nombre">${res.name || res.moduleName}</span>
      <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" id="lightSwitch-main" ${
            res.state ? 'checked' : ''
          }>
          <label class="form-check-label" for="lightSwitch-main"></label>
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

  const slider = document.querySelector('.form-range') as HTMLInputElement;
  slider.disabled = false;
  slider.value = String(res.dimming);
  shortcutCreated = true;

  slider.addEventListener('change', (e) => {
    //window.electronAPI.setBrightness(e.target.value);
  });
}

function getLight() {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((event, res) => {
    if (res) {
      document.querySelector('.edit').classList.remove('visually-hidden');
      document.querySelector('.lights').innerHTML = `
          <div class="row">
          <div class="col-sm-4 w-50">
          <div class="d-flex p-2 align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
            <div class="rounded rounded-circle p-3">
                <i class="fa-solid fa-lightbulb fa-2xl"></i>
            </div>
            <div class="d-flex justify-content-between flex-fill bulb">
                <span>${res.name || res.moduleName}</span>
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
      addSwitchToggleToSidebar(res);
    }
    toggleSwitch();
  });

  document.querySelector('.lights').innerHTML = `
    <div class="row">
      <div class="col-sm-4 w-50">
        <div class="d-flex p-2 align-items-center gap-2 text-white rounded bg-primary bg-opacity-25 border border-2 border-primary fw-bold">
          <div class="rounded rounded-circle p-3">
            <i class="fa-solid fa-lightbulb fa-2xl"></i>
          </div>
          <div class="d-flex justify-content-between flex-fill bulb align-items-center">
            <span>Searching bulb...</span>
            <div class="spinner-border text-white" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <p class="text-white fw-bold mt-2 ms-2 text-xs">Can't find bulb?
          <button  class="fw-normal link-primary text-decoration-none border-0  bg-transparent add" type="button" data-bs-toggle="modal" data-bs-target="#addModal">Add it manually</button>
        </p>
      </div>
    </div>`;
}

let editActive = false;

function disableEdit(editLabel: HTMLLabelElement) {
  const input = document.querySelector('.inputEdit') as HTMLInputElement;
  const bulb = document.querySelector('.bulb');

  const newName = input.value;
  //window.electronAPI.setBulbName(newName);

  const sidebarName = document.querySelector('.sidebar-nombre') as HTMLSpanElement;
  sidebarName.innerText = newName;

  editLabel.innerText = 'Change Name';

  const span = document.createElement('span');
  span.innerText = newName;
  bulb.replaceChild(span, bulb.childNodes[1]);
  editActive = false;
}

function editName() {
  const editBtn = document.querySelector('.edit i');
  const editLabel = document.querySelector('.edit span') as HTMLLabelElement;
  editBtn.classList.toggle('fa-pencil');
  editBtn.classList.toggle('fa-floppy-disk');
  editLabel.innerText = 'Save Name';

  if (!editActive) {
    const input = document.createElement('input') as HTMLInputElement;
    input.type = 'text';
    input.classList.add('inputEdit');
    input.maxLength = 15;

    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        editBtn.classList.toggle('fa-pencil');
        editBtn.classList.toggle('fa-floppy-disk');
        disableEdit(editLabel);
      }
    });

    const bulb = document.querySelector('.bulb') as HTMLDivElement;
    input.value = (bulb.childNodes[1] as HTMLElement).innerText;
    bulb.replaceChild(input, bulb.childNodes[1]);
    editActive = true;
  } else {
    disableEdit(editLabel);
  }
}

function addIp() {
  const form = document.querySelector('.needs-validation');
  const ipInput = document.querySelector('.ipInput') as HTMLInputElement;
  document.getElementById('addModal').addEventListener('shown.bs.modal', () => {
    ipInput.focus();
  });

  form.addEventListener('submit', (event) => {
    if (ipInput.value.match('^(?:[0-9]{1,3}.){3}[0-9]{1,3}$')) {
      ipInput.classList.remove('is-invalid');
      ipInput.classList.add('is-valid');
      form.classList.add('was-validated');
      //window.electronAPI.setIp(ipInput.value);
    } else {
      event.preventDefault();
      event.stopPropagation();
      form.classList.remove('was-validated');
      ipInput.classList.add('is-invalid');
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  getLight();
  console.log('HELLO FROM SCRIPT!');
  /* addIp();
  document.querySelector('.redirect').addEventListener('click', () => {
    window.electronAPI.visitAuthor();
  });
  document.querySelector('.edit').addEventListener('click', () => {
    editName();
  }); */
});
