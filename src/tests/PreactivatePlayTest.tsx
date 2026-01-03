import { useRef, useState, useEffect } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { PLAYLIST_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

// 30개로 확장된 플레이리스트 (URL 반복)
const EXTENDED_PLAYLIST = Array.from({ length: 30 }, (_, i) => ({
  ...PLAYLIST_URLS[i % PLAYLIST_URLS.length],
  name: `#${i + 1}`,
}));

type PlaybackLog = {
  index: number;
  name: string;
  status: 'activated' | 'playing' | 'scheduled' | 'blocked';
  time: number;
};

export function PreactivatePlayTest() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(1);
  const [activated, setActivated] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const intervalMs = intervalSeconds * 1000;

  // 로그 추가 시 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 현재 재생 영상으로 자동 스크롤
  useEffect(() => {
    if (currentIndex >= 0 && videoContainerRef.current) {
      const videoWidth = 80 + 6; // width + gap
      const containerWidth = videoContainerRef.current.clientWidth;
      const scrollTo = (currentIndex * videoWidth) - (containerWidth / 2) + (videoWidth / 2);
      videoContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const addLog = (index: number, logStatus: PlaybackLog['status']) => {
    setLogs(prev => [...prev, {
      index,
      name: EXTENDED_PLAYLIST[index].name,
      status: logStatus,
      time: Date.now() - startTimeRef.current,
    }]);
  };

  const playVideo = async (index: number) => {
    if (index >= EXTENDED_PLAYLIST.length) {
      setStatus('success');
      return;
    }

    const video = videoRefs.current[index];
    if (!video) return;

    setCurrentIndex(index);

    try {
      await video.play();
      addLog(index, 'playing');

      // 다음 영상 예약
      if (index + 1 < EXTENDED_PLAYLIST.length) {
        addLog(index + 1, 'scheduled');
        timeoutRef.current = window.setTimeout(() => {
          video.pause();
          playVideo(index + 1);
        }, intervalMs);
      } else {
        video.onended = () => {
          setStatus('success');
        };
      }
    } catch (err) {
      console.log(`Video ${index} blocked:`, err);
      addLog(index, 'blocked');
      setStatus('failed');
    }
  };

  const handleStart = async () => {
    setStatus('running');
    setLogs([]);
    setCurrentIndex(-1);
    startTimeRef.current = Date.now();

    // 핵심: 모든 비디오를 play() 후 즉시 pause()하여 "활성화"
    const activationPromises = videoRefs.current.map(async (video, i) => {
      if (!video) return;
      video.currentTime = 0;
      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
        addLog(i, 'activated');
      } catch (err) {
        console.log(`Pre-activation failed for video ${i}:`, err);
      }
    });

    await Promise.all(activationPromises);
    setActivated(true);

    // 잠시 대기 후 첫 번째 영상 재생
    setTimeout(() => {
      playVideo(0);
    }, 100);
  };

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus('pending');
    setCurrentIndex(-1);
    setLogs([]);
    setActivated(false);
    videoRefs.current.forEach(v => {
      if (v) {
        v.pause();
        v.currentTime = 0;
        v.onended = null;
      }
    });
  };

  const isRunning = status === 'running';

  const activatedCount = logs.filter(l => l.status === 'activated').length;

  return (
    <TestCard
      title="사전 활성화 테스트 (30개)"
      description={`클릭 시 ${EXTENDED_PLAYLIST.length}개 video를 모두 play→pause로 활성화해야 함`}
    >
      {/* 경고 메시지 */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
      }}>
        <strong>⚠️ 문제점:</strong> 재생할 영상이 {EXTENDED_PLAYLIST.length}개일 때,
        사용자 클릭 시점에 <strong>모든 video 엘리먼트를 play→pause로 활성화</strong>해야 합니다.
        {activated && (
          <span style={{ color: '#059669', marginLeft: 8 }}>
            ✓ {activatedCount}개 활성화 완료
          </span>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          전환 간격:
          <input
            type="range"
            min={1}
            max={10}
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(Number(e.target.value))}
            disabled={isRunning}
          />
          <span style={{ minWidth: 40, fontWeight: 600 }}>{intervalSeconds}초</span>
        </label>
      </div>

      {/* 가로 스크롤 비디오 목록 */}
      <div
        ref={videoContainerRef}
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
      >
        {EXTENDED_PLAYLIST.map((item, i) => {
          const isActivated = logs.some(l => l.index === i && l.status === 'activated');
          const isCurrent = currentIndex === i;
          const isPlayed = logs.some(l => l.index === i && l.status === 'playing');

          return (
            <div
              key={i}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 80,
                border: isCurrent ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: 6,
                opacity: isPlayed && !isCurrent ? 0.5 : 1,
              }}
            >
              <video
                ref={el => { videoRefs.current[i] = el; }}
                src={item.url}
                playsInline
                preload="metadata"
                muted
                style={{
                  width: '100%',
                  borderRadius: 4,
                  backgroundColor: '#000',
                }}
              />
              <div style={{
                position: 'absolute',
                top: 2,
                left: 2,
                backgroundColor: isActivated ? 'rgba(124, 58, 237, 0.9)' : 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '1px 4px',
                borderRadius: 3,
                fontSize: 9,
              }}>
                {isActivated ? '⚡' : ''}{item.name}
              </div>
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <div
          ref={logContainerRef}
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {logs.map((log, i) => (
            <div key={i} style={{
              color: log.status === 'blocked' ? '#dc2626' :
                     log.status === 'playing' ? '#059669' :
                     log.status === 'activated' ? '#7c3aed' : '#f59e0b'
            }}>
              [{(log.time / 1000).toFixed(1)}s] {log.name}: {
                log.status === 'activated' ? '⚡ 사전 활성화 완료' :
                log.status === 'playing' ? '▶ 재생 시작' :
                log.status === 'scheduled' ? `⏱ ${intervalSeconds}초 후 예약됨` :
                '✗ 차단됨'
              }
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleStart} disabled={isRunning}>
          재생
        </button>
        {status !== 'pending' && status !== 'running' && (
          <button onClick={reset}>리셋</button>
        )}
      </div>

      <ResultBadge status={status} />
    </TestCard>
  );
}
