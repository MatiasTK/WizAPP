import { useBulb } from './BulbContext';
import { BulbState } from '../types';
import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaFloppyDisk, FaTrash } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

interface ModalEditColorProps {
  currentEditColor: BulbState['customColors'][0];
  show: boolean;
  handleClose: () => void;
}

export default function ModalEditColor({
  currentEditColor,
  show,
  handleClose,
}: ModalEditColorProps) {
  const { setBulb } = useBulb();
  const { t } = useTranslation();

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#ffffff');

  useEffect(() => {
    if (!currentEditColor) return;

    setColorName(currentEditColor.name);
    setColorHex(currentEditColor.hex);
  }, [currentEditColor]);

  const editColorHandler = (e: React.FormEvent) => {
    e.preventDefault();
    setBulb((prev) => {
      return {
        ...prev,
        customColors: prev.customColors.map((color) =>
          color.id === currentEditColor.id ? { ...color, name: colorName, hex: colorHex } : color
        ),
      };
    });
    window.electronAPI.editCustomColor(currentEditColor.id, colorName, colorHex);
    handleClose();
  };

  const removeColorHandler = () => {
    setBulb((prev) => {
      return {
        ...prev,
        customColors: prev.customColors.filter((color) => color.id !== currentEditColor.id),
      };
    });
    window.electronAPI.removeCustomColor(currentEditColor.id);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} data-bs-theme="dark" className="text-white" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('scenes.custom.editColor')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={editColorHandler}>
        <Modal.Body>
          <Form.Label>{t('scenes.custom.name')}</Form.Label>
          <Form.Control
            type="text"
            maxLength={20}
            minLength={1}
            value={colorName}
            autoFocus
            onChange={(e) => setColorName(e.target.value)}
            placeholder={t('scenes.custom.namePlaceholder')}
          />
          <Form.Label className="mt-2">{t('scenes.custom.pickColor')}:</Form.Label>
          <Form.Control
            type="color"
            value={colorHex}
            className="w-100"
            onChange={(e) => setColorHex(e.target.value)}
            title={t('scenes.custom.pickColorPlaceholder')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={removeColorHandler}>
            <FaTrash />
            <span className="ms-1">{t('remove')}</span>
          </Button>
          <Button type="submit" variant="primary">
            <FaFloppyDisk />
            <span className="ms-1">{t('SaveChanges')}</span>
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
