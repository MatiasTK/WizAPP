import { useState } from 'react';
import Dynamic from './Dynamic';
import Sidebar from './Sidebar';
import Static from './Static';
import Custom from './Custom';

export default function Scenes() {
  const [activeTab, setActiveTab] = useState('static');

  const renderTab = () => {
    switch (activeTab) {
      case 'static':
        return <Static />;
      case 'dynamic':
        return <Dynamic />;
      case 'custom':
        return <Custom />;
      default:
        return <Static />;
    }
  };

  return (
    <main className="d-flex flex-nowrap bg-main vh-100">
      <Sidebar />
      <div className="container-fluid overflow-y-scroll">
        <header className="d-flex flex-wrap flex-column align-items-center justify-content-center py-4">
          <div className="pb-4">
            <span className="text-white display-6 fw-bold">Scenes</span>
          </div>
          <ul className="nav nav-pills fs-5">
            <li
              className="nav-item"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('static')}
            >
              <a className={`nav-link rounded-5 ${activeTab == 'static' ? 'active' : ''}`}>
                Static
              </a>
            </li>
            <li
              className="nav-item"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('dynamic')}
            >
              <a className={`nav-link rounded-5 ${activeTab == 'dynamic' ? 'active' : ''}`}>
                Dynamic
              </a>
            </li>
            <li
              className="nav-item"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('custom')}
            >
              <a className={`nav-link rounded-5 ${activeTab == 'custom' ? 'active' : ''}`}>
                Custom
              </a>
            </li>
          </ul>
        </header>
        {renderTab()}
      </div>
    </main>
  );
}
