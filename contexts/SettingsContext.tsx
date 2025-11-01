import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Settings } from '../types';

export type SoundType = 'add' | 'success' | 'delete' | 'payment' | 'print';

interface SettingsContextType {
  settings: Settings;
  setCurrency: (currency: Settings['currency']) => void;
  toggleTheme: () => void;
  toggleSoundEffects: () => void;
  playSound: (type: SoundType) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('appSettings', {
    currency: 'IQD',
    theme: 'light',
    soundEffects: true,
    expenseThresholdEnabled: true,
    expenseThresholdAmount: 1000000,
    recurringExpenseReminderEnabled: true,
    recurringExpenseReminderDays: 3,
  });

  const setCurrency = (currency: Settings['currency']) => {
    setSettings(prev => ({ ...prev, currency }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const toggleSoundEffects = () => {
    setSettings(prev => ({ ...prev, soundEffects: !prev.soundEffects }));
  };
  
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const playSound = (type: SoundType) => {
    if (!settings.soundEffects) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error);
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    let duration = 0.15;
    let rampUpTime = 0.01;
    let volume = 0.3;

    switch (type) {
        case 'add':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            duration = 0.2;
            volume = 0.4;
            break;

        case 'payment':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime); // C6 "Bling"
            duration = 0.2;
            volume = 0.3;
            break;
        
        case 'print':
            oscillator.type = 'square';
            volume = 0.15;
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
            duration = 0.1;
            break;

        case 'success': // For updates
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
            duration = 0.15;
            volume = 0.3;
            break;
        
        case 'delete':
            oscillator.type = 'sawtooth';
            volume = 0.2;
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.2);
            duration = 0.2;
            break;
    }

    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + rampUpTime);
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  };

  return (
    <SettingsContext.Provider value={{ settings, setCurrency, toggleTheme, toggleSoundEffects, playSound, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};