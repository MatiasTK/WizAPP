import { useState } from 'react';
import { useBulb } from './BulbContext';
import { Button, Form, Modal, ModalHeader } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface ModalCreateColorProps {
  show: boolean;
  handleClose: () => void;
}

export default function ModalCreateColor({ show, handleClose }: ModalCreateColorProps) {
  const { setBulb } = useBulb();
  const { t } = useTranslation();

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#ffffff');

  const addNewColorHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName || !colorHex) return;

    window.electronAPI.addCustomColor(colorName, colorHex);
    setBulb((prev) => {
      return {
        ...prev,
        customColors: [
          ...prev.customColors,
          {
            id:
              prev.customColors.length === 0
                ? 33
                : prev.customColors[prev.customColors.length - 1].id + 1,
            name: colorName,
            hex: colorHex,
          },
        ],
      };
    });

    setColorName('');
    setColorHex('#ffffff');
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} data-bs-theme="dark" className="text-white" centered>
      <ModalHeader closeButton>
        <Modal.Title>{t('scenes.custom.addColor')}</Modal.Title>
      </ModalHeader>
      <Form onSubmit={addNewColorHandler}>
        <Modal.Body>
          <Form.Label>{t('scenes.custom.name')}</Form.Label>
          <Form.Control
            type="text"
            maxLength={20}
            minLength={1}
            placeholder={t('scenes.custom.namePlaceholder')}
            required
            autoFocus
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
          />
          <Form.Label className="mt-2">{t('scenes.custom.pickColor')}:</Form.Label>
          <Form.Control
            type="color"
            defaultValue="#ffffff"
            title={t('scenes.custom.pickColorPlaceholder')}
            className="w-100"
            onChange={(e) => setColorHex(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t('close')}
          </Button>
          <Button type="submit">{t('scenes.custom.add')}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
