import { createContext, useContext, useState } from 'react';

export type Tone = 'immigrant' | 'financebro' | 'bestie';

interface ToneContextValue {
  tone: Tone;
  setTone: (t: Tone) => void;
}

const ToneContext = createContext<ToneContextValue>({
  tone: 'immigrant',
  setTone: () => {},
});

export function ToneProvider({ children }: { children: React.ReactNode }) {
  const [tone, setTone] = useState<Tone>('immigrant');
  return (
    <ToneContext.Provider value={{ tone, setTone }}>
      {children}
    </ToneContext.Provider>
  );
}

export function useTone() {
  return useContext(ToneContext);
}
