import { createContext, useContext, useEffect, useState } from 'react';
import { BulbState } from '../types';

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
    window.electronAPI.bulbStateRequest();
    window.electronAPI.bulbStateResponse((bulb) => {
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
