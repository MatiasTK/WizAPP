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
  });
};

// TODO: Add more scenes

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
