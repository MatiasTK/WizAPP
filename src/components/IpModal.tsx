import { useState } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface IpModalProps {
  show: boolean;
  handleClose: () => void;
}

export default function IpModal({ show, handleClose }: IpModalProps) {
  const [value, setValue] = useState<string>('');
  const [invalidIP, setInvalidIP] = useState<boolean>(false);
  const ipRegex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!ipRegex.test(value)) {
      setInvalidIP(true);
      return;
    }
    window.electronAPI.setIp(value);
    handleClose();
  };

  const handleChangeIp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvalidIP(false);
    setValue(e.target.value);
  };

  return (
    <Modal show={show} onHide={handleClose} data-bs-theme="dark" className="text-white" centered>
      <ModalHeader closeButton>
        <ModalTitle>{t('ip.add')}</ModalTitle>
      </ModalHeader>
      <Form noValidate onSubmit={handleSubmit}>
        <ModalBody>
          <Form.Group className="mb-3" controlId="ip">
            <Form.Label>IP</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('ip.placeholder')}
              autoFocus
              required
              value={value}
              onChange={handleChangeIp}
              isValid={ipRegex.test(value)}
              isInvalid={invalidIP}
            />
            <Form.Control.Feedback type="invalid">{t('ip.invalid')}</Form.Control.Feedback>
            <Form.Control.Feedback type="valid">{t('ip.valid')}</Form.Control.Feedback>
          </Form.Group>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>
            {t('close')}
          </Button>
          <Button variant="primary" type="submit">
            {t('SaveChanges')}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}
