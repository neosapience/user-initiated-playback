import { useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import type { TestStatus } from '../types/autoplay';

const VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

interface Props {
  delayMs: number;
}

type DelayType = 'setTimeout' | 'fetch';

export function DelayedAutoplay({ delayMs }: Props) {
  const [setTimeoutStatus, setSetTimeoutStatus] = useState<TestStatus>('pending');
  const [fetchStatus, setFetchStatus] = useState<TestStatus>('pending');
  const [progress, setProgress] = useState<{ type: DelayType; value: number } | null>(null);
  const [fetchKey, setFetchKey] = useState(Date.now()); // 캐시 버스팅용

  const setTimeoutVideoRef = useRef<HTMLVideoElement>(null);
  const fetchVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  const clearProgress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(null);
  };

  const startProgress = (type: DelayType) => {
    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress({ type, value: Math.min((elapsed / delayMs) * 100, 99) });
    }, 100);
  };

  // setTimeout 기반 테스트 (매크로태스크 - 컨텍스트 확실히 끊어짐)
  const handleSetTimeoutTest = async () => {
    setSetTimeoutStatus('running');
    startProgress('setTimeout');

    await new Promise(resolve => setTimeout(resolve, delayMs));

    clearProgress();

    try {
      const video = setTimeoutVideoRef.current;
      if (video) {
        await video.play();
        setSetTimeoutStatus('success');
      }
    } catch (err) {
      console.log('setTimeout test failed:', err);
      setSetTimeoutStatus('failed');
    }
  };

  // 실제 서버 지연 테스트 (Vite API)
  // src에 느린 URL이 설정되어 있고, 클릭 시 play() 호출
  const handleFetchTest = async () => {
    setFetchStatus('running');
    startProgress('fetch');

    try {
      const video = fetchVideoRef.current;
      if (video) {
        // play()가 비디오 로드를 기다림 (서버 지연 포함)
        await video.play();
        clearProgress();
        setFetchStatus('success');
      }
    } catch (err) {
      console.log('fetch test failed:', err);
      clearProgress();
      setFetchStatus('failed');
    }
  };

  const resetSetTimeout = () => {
    setSetTimeoutStatus('pending');
    if (setTimeoutVideoRef.current) {
      setTimeoutVideoRef.current.pause();
      setTimeoutVideoRef.current.currentTime = 0;
    }
  };

  const resetFetch = () => {
    setFetchStatus('pending');
    setFetchKey(Date.now()); // 캐시 버스팅
    if (fetchVideoRef.current) {
      fetchVideoRef.current.pause();
      fetchVideoRef.current.currentTime = 0;
    }
  };

  const isSetTimeoutRunning = setTimeoutStatus === 'running';
  const isFetchRunning = fetchStatus === 'running';

  return (
    <>
      <TestCard
        title={`setTimeout ${delayMs / 1000}초 지연`}
        description="매크로태스크 - 사용자 제스처 컨텍스트가 확실히 끊어짐"
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <video
            ref={setTimeoutVideoRef}
            src={VIDEO_URL}
            playsInline
            style={{ width: '100%', borderRadius: 4, backgroundColor: '#000' }}
          />
          {isSetTimeoutRunning && (
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

        {progress?.type === 'setTimeout' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress.value}%`, backgroundColor: '#3b82f6', transition: 'width 0.1s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {(progress.value / 100 * delayMs / 1000).toFixed(1)}초 / {delayMs / 1000}초
            </p>
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={handleSetTimeoutTest} disabled={isSetTimeoutRunning || isFetchRunning}>
            테스트
          </button>
          {setTimeoutStatus !== 'pending' && setTimeoutStatus !== 'running' && (
            <button onClick={resetSetTimeout}>리셋</button>
          )}
        </div>

        <ResultBadge status={setTimeoutStatus} />
      </TestCard>

      <TestCard
        title={`fetch ${delayMs / 1000}초 지연 (서버)`}
        description="서버 응답 지연 - src에 느린 URL 설정 후 play()"
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <video
            ref={fetchVideoRef}
            src={`/api/video?delay=${delayMs}&t=${fetchKey}`}
            preload="none"
            playsInline
            style={{ width: '100%', borderRadius: 4, backgroundColor: '#000' }}
          />
          {isFetchRunning && (
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

        {progress?.type === 'fetch' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress.value}%`, backgroundColor: '#10b981', transition: 'width 0.1s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {(progress.value / 100 * delayMs / 1000).toFixed(1)}초 / {delayMs / 1000}초
            </p>
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={handleFetchTest} disabled={isSetTimeoutRunning || isFetchRunning}>
            테스트
          </button>
          {fetchStatus !== 'pending' && fetchStatus !== 'running' && (
            <button onClick={resetFetch}>리셋</button>
          )}
        </div>

        <ResultBadge status={fetchStatus} />
      </TestCard>
    </>
  );
}
