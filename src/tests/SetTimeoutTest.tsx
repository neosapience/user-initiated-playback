import { useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { MEDIA_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

export function SetTimeoutTest() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [delaySeconds, setDelaySeconds] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  const delayMs = delaySeconds * 1000;

  const handleTest = async () => {
    setStatus('running');
    setProgress(0);

    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / delayMs) * 100, 99));
    }, 100);

    await new Promise(resolve => setTimeout(resolve, delayMs));

    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);

    try {
      const video = videoRef.current;
      if (video) {
        await video.play();
        setStatus('success');
      }
    } catch (err) {
      console.log('setTimeout test failed:', err);
      setStatus('failed');
    }
  };

  const reset = () => {
    setStatus('pending');
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const isRunning = status === 'running';

  return (
    <TestCard
      title="setTimeout 지연 테스트"
      description="매크로태스크 - 사용자 제스처 컨텍스트가 확실히 끊어짐"
    >
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          지연 시간:
          <input
            type="range"
            min={1}
            max={10}
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Number(e.target.value))}
            disabled={isRunning}
          />
          <span style={{ minWidth: 40, fontWeight: 600 }}>{delaySeconds}초</span>
        </label>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
        <video
          ref={videoRef}
          src={MEDIA_URLS.video}
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 4, backgroundColor: '#000' }}
        />
        {isRunning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 4,
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #fff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
      </div>

      {isRunning && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#3b82f6', transition: 'width 0.1s' }} />
          </div>
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {(progress / 100 * delayMs / 1000).toFixed(1)}초 / {delaySeconds}초
          </p>
        </div>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleTest} disabled={isRunning}>
          테스트
        </button>
        {status !== 'pending' && status !== 'running' && (
          <button onClick={reset}>리셋</button>
        )}
      </div>

      <ResultBadge status={status} />
    </TestCard>
  );
}
