import { ReactNode } from 'react';
import { useBulb } from '@context/BulbContext';
import {
  FaCouch,
  FaGlasses,
  FaMoon,
  FaMugHot,
  FaPalette,
  FaSnowflake,
  FaTv,
} from 'react-icons/fa6';
import { BsSunFill } from 'react-icons/bs';
import { PiFlowerLotusBold } from 'react-icons/pi';
import { RiPlantFill } from 'react-icons/ri';
import { Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Static() {
  const { bulb, setBulb } = useBulb();
  const { t } = useTranslation();

  const changeSceneHandler = (id: number) => {
    setBulb((prev) => {
      return { ...prev, sceneId: id, state: true };
    });
    window.electronAPI.setScene(id);
  };

  const renderItem = (name: string, sceneId: number, icon: ReactNode) => (
    <Col>
      <button
        className={`bg-secondary bg-opacity-25 text-white rounded-4 scene-button p-4 border-0 w-100 ${
          bulb && bulb.sceneId === sceneId ? 'active' : ''
        }`}
        data-sceneid={sceneId.toString()}
        disabled={!bulb}
        onClick={() => changeSceneHandler(sceneId)}
      >
        <a className="text-decoration-none d-flex flex-row text-white align-items-center">
          {icon}
          <span className="fw-bold text-nowrap ms-2">{name}</span>
        </a>
      </button>
    </Col>
  );

  return (
    <div className="ms-3 d-flex flex-column h-50">
      <div className="my-auto">
        <h2 className="ms-4 text-white mb-4">{t('scenes.static.whites')}</h2>
        <Row md={3} lg={4} xl={5} className="row-gap-3">
          {renderItem(t('scenes.static.warmWhite'), 11, <FaMugHot size={25} />)}
          {renderItem(t('scenes.static.dayLight'), 12, <BsSunFill size={25} />)}
          {renderItem(t('scenes.static.coldWhite'), 13, <FaSnowflake size={25} />)}
        </Row>
      </div>
      <div className="pb-4">
        <h2 className="ms-4 text-white my-4">{t('scenes.static.functional')}</h2>
        <Row md={3} lg={4} xl={5} className="row-gap-3">
          {renderItem(t('scenes.static.nightLight'), 14, <FaMoon size={25} />)}
          {renderItem(t('scenes.static.cozy'), 6, <FaCouch size={25} />)}
          {renderItem(t('scenes.static.trueColors'), 17, <FaPalette size={25} />)}
          {renderItem(t('scenes.static.relax'), 16, <PiFlowerLotusBold size={25} />)}
          {renderItem(t('scenes.static.focus'), 15, <FaGlasses size={25} />)}
          {renderItem(t('scenes.static.tvTime'), 18, <FaTv size={25} />)}
          {renderItem(t('scenes.static.plantGrowth'), 19, <RiPlantFill size={25} />)}
        </Row>
      </div>
    </div>
  );
}
