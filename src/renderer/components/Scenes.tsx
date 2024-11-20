import { useState } from 'react';
import Dynamic from '@components/Dynamic';
import Sidebar from '@components/Sidebar';
import Static from '@components/Static';
import Custom from '@components/Custom';
import { Container, Nav, NavItem, NavLink } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Scenes() {
  const [activeTab, setActiveTab] = useState('static');
  const { t } = useTranslation();

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
      <Container fluid className="overflow-y-scroll">
        <header className="d-flex flex-wrap flex-column align-items-center justify-content-center py-4">
          <h1 className="pb-4">
            <span className="text-white display-6 fw-bold">{t('Scenes')}</span>
          </h1>
          <Nav variant="pills" className="fs-5">
            <NavItem style={{ cursor: 'pointer' }} onClick={() => setActiveTab('static')}>
              <NavLink className={`rounded-5 ${activeTab == 'static' ? 'active' : ''}`}>
                {t('scenes.static.title')}
              </NavLink>
            </NavItem>
            <NavItem style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dynamic')}>
              <NavLink className={`rounded-5 ${activeTab == 'dynamic' ? 'active' : ''}`}>
                {t('scenes.dynamic.title')}
              </NavLink>
            </NavItem>
            <NavItem style={{ cursor: 'pointer' }} onClick={() => setActiveTab('custom')}>
              <NavLink className={`rounded-5 ${activeTab == 'custom' ? 'active' : ''}`}>
                {t('scenes.custom.title')}
              </NavLink>
            </NavItem>
          </Nav>
        </header>
        {renderTab()}
      </Container>
    </main>
  );
}
