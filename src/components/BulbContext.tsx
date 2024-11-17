import { createContext, useContext, useEffect, useState } from 'react';
import { BulbState } from '../types';
import log from 'electron-log/renderer';

interface BulbContextProps {
  bulb: BulbState;
  setBulb: React.Dispatch<React.SetStateAction<BulbState>>;
}

interface BulbProviderProps {
  children: React.ReactNode;
}

export const BulbContext = createContext<BulbContextProps>(undefined);

export const BulbProvider: React.FC<BulbProviderProps> = ({ children }) => {
  const [bulb, setBulb] = useState<BulbState>();

  useEffect(() => {
    log.debug('Context loaded');
    window.electronAPI.getBulbWhenReady().then((bulb) => {
      log.debug('Bulb loaded:', bulb);
      setBulb(bulb);
    });
  }, []);

  useEffect(() => {
    window.electronAPI.onUpdateBulb((bulb) => {
      log.debug('Bulb updated:', bulb);
      setBulb(bulb);
    });
  }, []);

  return <BulbContext.Provider value={{ bulb, setBulb }}>{children}</BulbContext.Provider>;
};

export const useBulb = (): BulbContextProps => {
  const context = useContext(BulbContext);
  if (context === undefined) {
    throw new Error('useBulb must be used within a BulbProvider');
  }
  return context;
};
