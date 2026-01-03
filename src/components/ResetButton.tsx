import type { RefObject } from 'react';

interface Props {
  mediaRef: RefObject<HTMLMediaElement | null>;
}

export function ResetButton({ mediaRef }: Props) {
  const handleReset = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.pause();
    media.currentTime = 0;
  };

  return (
    <button onClick={handleReset}>
      리셋
    </button>
  );
}
