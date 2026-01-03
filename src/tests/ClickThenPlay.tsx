import { useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { ResetButton } from '../components/ResetButton';
import { MEDIA_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

export function ClickThenPlay() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = async () => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('running');

    try {
      await video.play();
      setStatus('success');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <TestCard
      title="클릭 후 즉시 재생"
      description="사용자 클릭 직후 play() 호출 - 허용됨"
    >
      <video
        ref={videoRef}
        src={MEDIA_URLS.video}
        playsInline
        preload="metadata"
        style={{ width: '100%', maxWidth: 320, borderRadius: 4 }}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleClick} disabled={status === 'running'}>
          클릭하여 재생
        </button>
        <ResetButton mediaRef={videoRef} />
      </div>
      <ResultBadge status={status} />
    </TestCard>
  );
}
