import { useState } from 'react';
import { BulbState } from '@dtypes/index';
import { useBulb } from '@context/BulbContext';
import ModalCreateColor from '@components/ModalCreateColor';
import ModalEditColor from '@components/ModalEditColor';
import { MdAddCircle, MdModeEditOutline } from 'react-icons/md';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Custom() {
  const { bulb, setBulb } = useBulb();
  const { t } = useTranslation();

  const [currentEditColor, setCurrentEditColor] = useState<BulbState['customColors'][0]>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const setCustomColorHandler = (id: number) => {
    setBulb((prev) => {
      return { ...prev, sceneId: id, state: true };
    });
    window.electronAPI.setCustomColor(id);
  };

  const handleCloseCreateModal = () => setShowCreateModal(false);
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleEditColorButton = (color: BulbState['customColors'][0]) => {
    setCurrentEditColor(color);
    setShowEditModal(true);
  };

  const renderCustomColor = (color: BulbState['customColors'][0]) => (
    <Col className="d-flex" key={color.id}>
      <button
        className={`d-flex justify-content-between align-items-center rounded-4 rounded-end-0 scene-button p-4 w-100 border-0 bg-secondary bg-opacity-25 ${
          bulb.sceneId === color.id ? 'active' : ''
        }`}
        data-sceneid={color.id}
        onClick={() => setCustomColorHandler(color.id)}
      >
        <a className="text-decoration-none d-flex flex-row align-items-center">
          <span className="dot" style={{ backgroundColor: color.hex }}></span>
          <span className="fw-bold text-nowrap ms-2 text-white">{color.name}</span>
        </a>
      </button>
      <button
        className={`scene-button bg-secondary bg-opacity-25 border-0 rounded-end-4 px-2 edit-color  ${
          bulb.sceneId === color.id ? 'active' : ''
        } `}
        onClick={() => handleEditColorButton(color)}
      >
        <MdModeEditOutline size={25} className="text-white" />
      </button>
    </Col>
  );

  return (
    <>
      <ModalCreateColor show={showCreateModal} handleClose={handleCloseCreateModal} />
      <ModalEditColor
        currentEditColor={currentEditColor}
        show={showEditModal}
        handleClose={handleCloseEditModal}
      />
      <div className="ms-3 d-flex flex-column">
        <div className="my-auto">
          <div className="d-flex align-items-center mb-4 ms-4">
            <h2 className="text-white mb-0">{t('scenes.custom.customColors')}</h2>
            <Button
              variant="primary"
              className="ms-3 text-white rounded-pill p-2"
              disabled={!bulb}
              onClick={() => setShowCreateModal(true)}
            >
              <a className="text-decoration-none d-flex flex-row text-white justify-content-center align-items-center">
                <MdAddCircle size={25} />
                <span className="text-nowrap fw-semibold ms-2">{t('scenes.custom.new')}</span>
              </a>
            </Button>
          </div>
          <Row md={3} lg={4} xl={5} className="row-gap-3">
            {bulb &&
              bulb.customColors &&
              bulb.customColors.map((color) => renderCustomColor(color))}
          </Row>
        </div>
      </div>
    </>
  );
}
