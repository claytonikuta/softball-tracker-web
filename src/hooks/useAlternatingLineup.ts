import { useState } from 'react';
import { Player } from '../types/Player';

const useAlternatingLineup = (initialLineup: Player[]) => {
  const [lineup, setLineup] = useState<Player[]>(initialLineup);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addPlayer = (player: Player) => {
    setLineup((prevLineup) => [...prevLineup, player]);
  };

  const getNextBatter = () => {
    if (lineup.length === 0) return null;
    const nextIndex = (currentIndex + 1) % lineup.length;
    setCurrentIndex(nextIndex);
    return lineup[nextIndex];
  };

  const getCurrentBatter = () => {
    return lineup[currentIndex];
  };

  const getBatterOnDeck = () => {
    if (lineup.length === 0) return null;
    const onDeckIndex = (currentIndex + 1) % lineup.length;
    return lineup[onDeckIndex];
  };

  const getBatterInTheHole = () => {
    if (lineup.length === 0) return null;
    const inTheHoleIndex = (currentIndex + 2) % lineup.length;
    return lineup[inTheHoleIndex];
  };

  return {
    lineup,
    addPlayer,
    getCurrentBatter,
    getNextBatter,
    getBatterOnDeck,
    getBatterInTheHole,
  };
};

export default useAlternatingLineup;