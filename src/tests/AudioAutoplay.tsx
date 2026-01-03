import { useEffect, useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { MEDIA_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

export function AudioAutoplay() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setStatus('running');

    const onPlaying = () => setStatus('success');

    audio.addEventListener('playing', onPlaying);

    audio.play()
      .then(() => setStatus('success'))
      .catch(() => setStatus('failed'));

    return () => {
      audio.removeEventListener('playing', onPlaying);
    };
  }, []);

  return (
    <TestCard
      title="오디오 autoplay"
      description="<audio autoplay> - 대부분 브라우저에서 차단"
    >
      <audio ref={audioRef} src={MEDIA_URLS.audio} autoPlay controls />
      <ResultBadge status={status} />
    </TestCard>
  );
}
