import { useState, useEffect } from 'react';

export function useTextMorph(words: string[], interval: number = 2200) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 500); // Animation duration
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  return { currentWord: words[index], isAnimating };
}
