import { useEffect, useState } from 'react';
import GameCanvas from '@/components/game/GameCanvas';

export default function GamePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return <GameCanvas isMobile={isMobile} />;
}