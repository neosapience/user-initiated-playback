import { useEffect, useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { MEDIA_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

export function UnmutedVideoAutoplay() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('running');

    video.play()
      .then(() => setStatus('success'))
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <TestCard
      title="소리 있는 비디오 autoplay"
      description="<video autoplay> (muted 없음) - 대부분 브라우저에서 차단"
    >
      <video
        ref={videoRef}
        src={MEDIA_URLS.video}
        playsInline
        autoPlay
        preload="metadata"
        style={{ width: '100%', maxWidth: 320, borderRadius: 4 }}
      />
      <ResultBadge status={status} />
    </TestCard>
  );
}
