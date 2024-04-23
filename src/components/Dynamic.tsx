import { JSX } from 'react/jsx-runtime';
import { useBulb } from './BulbContext';

export default function Dynamic() {
  const { bulb, setBulb } = useBulb();

  const changeSceneHandler = (id: number) => {
    setBulb((prev) => {
      return { ...prev, sceneId: id, state: true };
    });
    window.electronAPI.setScene(id);
  };

  const renderItem = (name: string, sceneId: number, icon: string, svgIcon: JSX.Element | '') => (
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
          {svgIcon ? svgIcon : <i className={`fa-solid ${icon} fa-xl`}></i>}
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
          {renderItem(
            'Candle Light',
            29,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-candle-filled"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M14 10h-4a2 2 0 0 0 -2 2v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1 -1v-9a2 2 0 0 0 -2 -2z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M11.254 2.334l-1.55 1.737c-1.042 1.277 -.898 3.097 .296 4.166a3 3 0 0 0 4.196 -4.28l-1.452 -1.624a1 1 0 0 0 -1.491 .001z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
          )}
          {renderItem('Pulse', 31, 'fa-wave-square', '')}
          {renderItem(
            'Golden White',
            30,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-sun-filled"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
          )}
          {renderItem(
            'Steampunk',
            32,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-steam"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M4 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M20 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M12 20m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M5.5 5.5l3 3" />
              <path d="M15.5 15.5l3 3" />
              <path d="M18.5 5.5l-3 3" />
              <path d="M8.5 15.5l-3 3" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <h2 className="ms-4 text-white my-4">Color</h2>
        <div className="row row-cols-3 row-cols-lg-4 row-cols-xl-5 row-gap-3">
          {renderItem(
            'Fireplace',
            5,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-campfire-filled"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M19.757 16.03a1 1 0 0 1 .597 1.905l-.111 .035l-16 4a1 1 0 0 1 -.597 -1.905l.111 -.035l16 -4z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M3.03 16.757a1 1 0 0 1 1.098 -.749l.115 .022l16 4a1 1 0 0 1 -.37 1.962l-.116 -.022l-16 -4a1 1 0 0 1 -.727 -1.213z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M13.553 2.106c-4.174 2.086 -6.553 5.358 -6.553 8.894a5 5 0 0 0 10 0c0 -1.047 -.188 -1.808 -.606 -2.705l-.169 -.345l-.33 -.647c-.621 -1.24 -.895 -2.338 -.895 -4.303a1 1 0 0 0 -1.447 -.894z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
          )}
          {renderItem('Fall', 22, 'fa-leaf', '')}
          {renderItem('Club', 26, 'fa-guitar', '')}
          {renderItem(
            'Sunset',
            3,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-sunset"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0" />
              <path d="M3 21l18 0" />
              <path d="M12 3v6l3 -3m-6 0l3 3" />
            </svg>
          )}
          {renderItem('Romance', 2, 'fa-heart', '')}
          {renderItem(
            'Party',
            4,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-confetti"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 5h2" />
              <path d="M5 4v2" />
              <path d="M11.5 4l-.5 2" />
              <path d="M18 5h2" />
              <path d="M19 4v2" />
              <path d="M15 9l-1 1" />
              <path d="M18 13l2 -.5" />
              <path d="M18 19h2" />
              <path d="M19 18v2" />
              <path d="M14 16.518l-6.518 -6.518l-4.39 9.58a1 1 0 0 0 1.329 1.329l9.579 -4.39z" />
            </svg>
          )}
          {renderItem('Pastel Colors', 8, 'fa-swatchbook', '')}
          {renderItem(
            'Rainbow',
            20,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-flower"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M12 2a3 3 0 0 1 3 3c0 .562 -.259 1.442 -.776 2.64l-.724 1.36l1.76 -1.893c.499 -.6 .922 -1 1.27 -1.205a2.968 2.968 0 0 1 4.07 1.099a3.011 3.011 0 0 1 -1.09 4.098c-.374 .217 -.99 .396 -1.846 .535l-2.664 .366l2.4 .326c1 .145 1.698 .337 2.11 .576a3.011 3.011 0 0 1 1.09 4.098a2.968 2.968 0 0 1 -4.07 1.098c-.348 -.202 -.771 -.604 -1.27 -1.205l-1.76 -1.893l.724 1.36c.516 1.199 .776 2.079 .776 2.64a3 3 0 0 1 -6 0c0 -.562 .259 -1.442 .776 -2.64l.724 -1.36l-1.76 1.893c-.499 .601 -.922 1 -1.27 1.205a2.968 2.968 0 0 1 -4.07 -1.098a3.011 3.011 0 0 1 1.09 -4.098c.374 -.218 .99 -.396 1.846 -.536l2.664 -.366l-2.4 -.325c-1 -.145 -1.698 -.337 -2.11 -.576a3.011 3.011 0 0 1 -1.09 -4.099a2.968 2.968 0 0 1 4.07 -1.099c.348 .203 .771 .604 1.27 1.205l1.76 1.894c-1 -2.292 -1.5 -3.625 -1.5 -4a3 3 0 0 1 3 -3z" />
            </svg>
          )}
          {renderItem('Summer', 21, 'fa-umbrella-beach', '')}
          {renderItem('Forest', 7, 'fa-tree', '')}
          {renderItem(
            'Jungle',
            24,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-trees"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M16 5l3 3l-2 1l4 4l-3 1l4 4h-9" />
              <path d="M15 21l0 -3" />
              <path d="M8 13l-2 -2" />
              <path d="M8 12l2 -2" />
              <path d="M8 21v-13" />
              <path d="M5.824 16a3 3 0 0 1 -2.743 -3.69a3 3 0 0 1 .304 -4.833a3 3 0 0 1 4.615 -3.707a3 3 0 0 1 4.614 3.707a3 3 0 0 1 .305 4.833a3 3 0 0 1 -2.919 3.695h-4z" />
            </svg>
          )}
          {renderItem('Mojito', 25, 'fa-martini-glass', '')}
          {renderItem('Ocean', 1, 'fa-water', '')}
          {renderItem('Deep Dive', 23, 'fa-fish', '')}
          {renderItem('Christmas', 27, 'fa-candy-cane', '')}
          {renderItem(
            'Halloween',
            28,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-pumpkin-scary"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 15l1.5 1l1.5 -1l1.5 1l1.5 -1" />
              <path d="M10 11h.01" />
              <path d="M14 11h.01" />
              <path d="M17 6.082c2.609 .588 3.627 4.162 2.723 7.983c-.903 3.82 -2.75 6.44 -5.359 5.853a3.355 3.355 0 0 1 -.774 -.279a3.728 3.728 0 0 1 -1.59 .361c-.556 0 -1.09 -.127 -1.59 -.362a3.296 3.296 0 0 1 -.774 .28c-2.609 .588 -4.456 -2.033 -5.36 -5.853c-.903 -3.82 .115 -7.395 2.724 -7.983c1.085 -.244 1.575 .066 2.585 .787c.716 -.554 1.54 -.869 2.415 -.869c.876 0 1.699 .315 2.415 .87c1.01 -.722 1.5 -1.032 2.585 -.788z" />
              <path d="M12 6c0 -1.226 .693 -2.346 1.789 -2.894l.211 -.106" />
            </svg>
          )}
        </div>
      </div>
      <div className="pb-4">
        <h2 className="ms-4 text-white my-4">Progressive</h2>
        <div className="row row-cols-3 row-cols-lg-4 row-cols-xl-5 row-gap-3">
          {renderItem('Bedtime', 10, 'fa-bed', '')}
          {renderItem(
            'Wake Up',
            9,
            '',
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-alarm-filled"
              width="30"
              height="26"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M16 6.072a8 8 0 1 1 -11.995 7.213l-.005 -.285l.005 -.285a8 8 0 0 1 11.995 -6.643zm-4 2.928a1 1 0 0 0 -1 1v3l.007 .117a1 1 0 0 0 .993 .883h2l.117 -.007a1 1 0 0 0 .883 -.993l-.007 -.117a1 1 0 0 0 -.993 -.883h-1v-2l-.007 -.117a1 1 0 0 0 -.993 -.883z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M6.412 3.191a1 1 0 0 1 1.273 1.539l-.097 .08l-2.75 2a1 1 0 0 1 -1.273 -1.54l.097 -.08l2.75 -2z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M16.191 3.412a1 1 0 0 1 1.291 -.288l.106 .067l2.75 2a1 1 0 0 1 -1.07 1.685l-.106 -.067l-2.75 -2a1 1 0 0 1 -.22 -1.397z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
