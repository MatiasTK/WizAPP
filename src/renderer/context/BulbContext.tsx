import { BulbState } from '@dtypes/index';
import log from 'electron-log/renderer';
import { createContext, useContext, useEffect, useState } from 'react';

interface BulbContextProps {
  bulb: BulbState;
  setBulb: React.Dispatch<React.SetStateAction<BulbState>>;
}

interface BulbProviderProps {
  children: React.ReactNode;
}

export const BulbContext = createContext<BulbContextProps>(undefined);

const BulbProvider: React.FC<BulbProviderProps> = ({ children }: BulbProviderProps) => {
  const [bulb, setBulb] = useState<BulbState>();

  useEffect(() => {
    log.debug('[RENDERER] Context loaded');
    window.electronAPI.getBulbWhenReady().then((bulb: BulbState) => {
      log.debug('[RENDERER] Bulb loaded');
      setBulb(bulb);
    });
  }, []);

  useEffect(() => {
    window.electronAPI.onUpdateBulb((bulb: BulbState) => {
      log.debug('[RENDERER] Bulb updated');
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

export default BulbProvider;
