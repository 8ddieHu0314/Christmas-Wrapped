'use client';

import { useState } from 'react';
import DayBox from './DayBox';
import RevealModal from './RevealModal';
import confetti from 'canvas-confetti';

interface CalendarGridProps {
  revealedDays: number[];
  onReveal: (day: number) => void;
  testMode: boolean;
}

export default function CalendarGrid({ revealedDays, onReveal, testMode }: CalendarGridProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDay, setLoadingDay] = useState<number | null>(null);

  const handleBoxClick = async (day: number, "isUnlocked": boolean, "isRevealed": boolean) => {
    if (!isUnlocked) return;

    if (isRevealed) {
      // Just show the modal again without animation
      fetchAndShowResult(day);
      return;
    }

    // New reveal
    setLoadingDay(day);
    try {
      const response = await fetch('/api/reveal-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, testMode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { "y": 0.6 }
        });
        
        // Play sound (optional, browser policy might block)
        // const audio = new Audio('/jingle.mp3');
        // audio.play().catch(e => console.log('Audio play failed', e));

        onReveal(day);
        setModalData(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Reveal error', error);
    } finally {
      setLoadingDay(null);
    }
  };

  const fetchAndShowResult = async (day: number) => {
    setLoadingDay(day);
    try {
      // Re-fetch result logic (reuse the API)
      const response = await fetch('/api/reveal-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, testMode }),
      });
      const data = await response.json();
      if (data.success) {
        setModalData(data);
        setIsModalOpen(true);
      }
    } finally {
      setLoadingDay(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-4 md:gap-6 aspect-square max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((day) => (
          <DayBox
            key={day}
            day={day}
            isRevealed={revealedDays.includes(day)}
            isLoading={loadingDay === day}
            testMode={testMode}
            onClick={(isUnlocked, isRevealed) => handleBoxClick(day, isUnlocked, isRevealed)}
          />
        ))}
      </div>
      
      {isModalOpen && modalData && (
        <RevealModal 
          data={modalData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}