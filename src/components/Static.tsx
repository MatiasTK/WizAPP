import { useBulb } from './BulbContext';

export default function Static() {
  const { bulb, setBulb } = useBulb();

  const changeSceneHandler = (id: number) => {
    setBulb((prev) => {
      return { ...prev, sceneId: id, state: true };
    });
    window.electronAPI.setScene(id);
  };

  const renderItem = (name: string, sceneId: number, icon: string) => (
    <div className="col">
      <button
        className={`bg-secondary bg-opacity-25 text-white rounded-4 scene-button p-4 border-0 w-100 ${
          bulb && bulb.sceneId === sceneId ? 'active' : ''
        }`}
        data-sceneid={sceneId.toString()}
        disabled={!bulb}
        onClick={() => changeSceneHandler(sceneId)}
      >
        <a className="text-decoration-none d-flex flex-row text-white align-items-center">
          <i className={`fa-solid ${icon} fa-xl`}></i>
          <span className="fw-bold text-nowrap ms-2">{name}</span>
        </a>
      </button>
    </div>
  );

  return (
    <div className="ms-3 d-flex flex-column h-50">
      <div className="my-auto">
        <h2 className="ms-4 text-white mb-4">Whites</h2>
        <div className="row row-cols-3 row-cols-lg-4 row-cols-xl-5 row-gap-3">
          {renderItem('Warm White', 11, 'fa-mug-hot')}
          {renderItem('Day Light', 12, 'fa-sun')}
          {renderItem('Cold White', 13, 'fa-snowflake')}
        </div>
      </div>
      <div className="pb-4">
        <h2 className="ms-4 text-white my-4">Functional</h2>
        <div className="row row-cols-3 row-cols-lg-4 row-cols-xl-5 row-gap-3">
          {renderItem('Night Light', 14, 'fa-moon')}
          {renderItem('Cozy', 6, 'fa-couch')}
          {renderItem('True Colors', 17, 'fa-palette')}
          {renderItem('Relax', 16, 'fa-campground')}
          {renderItem('Focus', 15, 'fa-glasses')}
          {renderItem('TV Time', 18, 'fa-television')}
          {renderItem('Plant Growth', 19, 'fa-seedling')}
        </div>
      </div>
    </div>
  );
}
