interface PauseButtonProps {
  onPause: () => void;
}

export default function PauseButton({ onPause }: PauseButtonProps) {
  // Detect landscape orientation and mobile
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

  return (
    <button
      onClick={onPause}
      className={`absolute z-50 pointer-events-auto ${
        isMobile && isLandscape
          ? 'top-1 left-1/2 -translate-x-1/2'
          : 'top-2 right-2 sm:top-4 sm:right-4'
      }`}
      style={{
        paddingTop: isMobile && !isLandscape ? 'max(env(safe-area-inset-top, 0.5rem), 0.5rem)' : undefined
      }}
      aria-label="Pause game">

      <div
        className={`bg-black/60 backdrop-blur-sm border-2 border-cyan-400/60 rounded-lg transition-all hover:bg-black/80 hover:border-cyan-400 hover:scale-110 ${
          isMobile && isLandscape
            ? 'p-1.5'
            : 'p-2 sm:p-3'
        }`}
        style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)' }}>

        {/* Pause icon - two vertical bars */}
        <div className={`flex gap-1 ${isMobile && isLandscape ? 'gap-0.5' : 'gap-1'}`}>
          <div
            className={`bg-cyan-400 rounded-sm ${
              isMobile && isLandscape ? 'w-1 h-3' : 'w-1.5 h-4 sm:w-2 sm:h-6'
            }`}
            style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)' }} />

          <div
            className={`bg-cyan-400 rounded-sm ${
              isMobile && isLandscape ? 'w-1 h-3' : 'w-1.5 h-4 sm:w-2 sm:h-6'
            }`}
            style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)' }} />

        </div>
      </div>
    </button>);

}
