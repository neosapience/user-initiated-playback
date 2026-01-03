import { useEffect, useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { MEDIA_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

export function MutedVideoAutoplay() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('running');

    const handlePlay = () => setStatus('success');
    const handleError = () => setStatus('failed');

    video.addEventListener('play', handlePlay);
    video.addEventListener('error', handleError);

    // autoplay 속성 실패 시 play() 시도
    video.play().catch(() => setStatus('failed'));

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <TestCard
      title="음소거 비디오 autoplay"
      description="<video autoplay muted> - 대부분 브라우저에서 허용"
    >
      <video
        ref={videoRef}
        src={MEDIA_URLS.video}
        muted
        playsInline
        autoPlay
        preload="metadata"
        style={{ width: '100%', maxWidth: 320, borderRadius: 4 }}
      />
      <ResultBadge status={status} />
    </TestCard>
  );
}
