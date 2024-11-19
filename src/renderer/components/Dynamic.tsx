import { useBulb } from '@context/BulbContext';
import { GiCandleHolder, GiHighGrass, GiPalmTree, GiSteampunkGoggles } from 'react-icons/gi';
import { BsFillSunsetFill, BsSunriseFill } from 'react-icons/bs';
import { TbCampfireFilled } from 'react-icons/tb';
import { FaCanadianMapleLeaf, FaHeart } from 'react-icons/fa';
import { IoMdMicrophone } from 'react-icons/io';
import { LuPartyPopper } from 'react-icons/lu';
import { HiColorSwatch } from 'react-icons/hi';
import { PiTreeFill } from 'react-icons/pi';
import { MdForest, MdSunny, MdWaves } from 'react-icons/md';
import { FaBed, FaCandyCane, FaMartiniGlass } from 'react-icons/fa6';
import { IoFish } from 'react-icons/io5';
import { RiGhostFill, RiPulseFill } from 'react-icons/ri';
import { ReactNode } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Dynamic() {
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
        <h2 className="ms-4 text-white mb-4">{t('scenes.dynamic.whites')}</h2>
        <Row md={3} lg={4} xl={5} className="row-gap-3">
          {renderItem(t('scenes.dynamic.candleLight'), 29, <GiCandleHolder size={25} />)}
          {renderItem(t('scenes.dynamic.pulse'), 31, <RiPulseFill size={25} />)}
          {renderItem(t('scenes.dynamic.goldenWhite'), 30, <MdSunny size={25} />)}
          {renderItem(t('scenes.dynamic.steampunk'), 32, <GiSteampunkGoggles size={25} />)}
        </Row>
      </div>
      <div>
        <h2 className="ms-4 text-white my-4">{t('scenes.dynamic.color')}</h2>
        <Row md={3} lg={4} xl={5} className="row-gap-3">
          {renderItem(t('scenes.dynamic.fireplace'), 5, <TbCampfireFilled size={25} />)}
          {renderItem(t('scenes.dynamic.fall'), 22, <FaCanadianMapleLeaf size={25} />)}
          {renderItem(t('scenes.dynamic.club'), 26, <IoMdMicrophone size={25} />)}
          {renderItem(t('scenes.dynamic.sunset'), 3, <BsFillSunsetFill size={25} />)}
          {renderItem(t('scenes.dynamic.romance'), 2, <FaHeart size={25} />)}
          {renderItem(t('scenes.dynamic.party'), 4, <LuPartyPopper size={25} />)}
          {renderItem(t('scenes.dynamic.pastelColors'), 8, <HiColorSwatch size={25} />)}
          {renderItem(t('scenes.dynamic.spring'), 20, <PiTreeFill size={25} />)}
          {renderItem(t('scenes.dynamic.summer'), 21, <GiPalmTree size={25} />)}
          {renderItem(t('scenes.dynamic.forest'), 7, <MdForest size={25} />)}
          {renderItem(t('scenes.dynamic.jungle'), 24, <GiHighGrass size={25} />)}
          {renderItem(t('scenes.dynamic.mojito'), 25, <FaMartiniGlass size={25} />)}
          {renderItem(t('scenes.dynamic.ocean'), 1, <MdWaves size={25} />)}
          {renderItem(t('scenes.dynamic.deepDive'), 23, <IoFish size={25} />)}
          {renderItem(t('scenes.dynamic.christmas'), 27, <FaCandyCane size={25} />)}
          {renderItem(t('scenes.dynamic.halloween'), 28, <RiGhostFill size={25} />)}
        </Row>
      </div>
      <div className="pb-4">
        <h2 className="ms-4 text-white my-4">{t('scenes.dynamic.progressive')}</h2>
        <Row md={3} lg={4} xl={5} className="row-gap-3">
          {renderItem(t('scenes.dynamic.bedtime'), 10, <FaBed size={25} />)}
          {renderItem(t('scenes.dynamic.wakeUp'), 9, <BsSunriseFill size={25} />)}
        </Row>
      </div>
    </div>
  );
}
