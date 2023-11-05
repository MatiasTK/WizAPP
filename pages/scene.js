const getActiveScene = () => {
  window.electronAPI.bulbStateRequest();
  window.electronAPI.bulbStateResponse((_event, res) => {
    const scenes = document.querySelectorAll('.scene');
    scenes.forEach((scene) => {
      if (parseInt(scene.dataset.sceneid) == res.sceneId) {
        scene.classList.add('active');
      }
    });
  });
};

window.addEventListener('DOMContentLoaded', () => {
  getActiveScene();
  const scenes = document.querySelectorAll('.scene');

  scenes.forEach((scene) => {
    scene.addEventListener('click', () => {
      scenes.forEach((scene) => {
        scene.classList.remove('active');
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
