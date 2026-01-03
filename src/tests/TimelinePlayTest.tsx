import { useRef, useState } from 'react';
import { TestCard } from '../components/TestCard';
import { ResultBadge } from '../components/ResultBadge';
import { PLAYLIST_URLS } from '../constants/mediaUrls';
import type { TestStatus } from '../types/autoplay';

type PlaybackLog = {
  index: number;
  name: string;
  status: 'playing' | 'scheduled' | 'blocked';
  time: number;
};

export function TimelinePlayTest() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  const intervalMs = intervalSeconds * 1000;

  const addLog = (index: number, logStatus: PlaybackLog['status']) => {
    setLogs(prev => [...prev, {
      index,
      name: PLAYLIST_URLS[index].name,
      status: logStatus,
      time: Date.now() - startTimeRef.current,
    }]);
  };

  const playVideo = async (index: number) => {
    if (index >= PLAYLIST_URLS.length) {
      setStatus('success');
      return;
    }

    const video = videoRefs.current[index];
    if (!video) return;

    setCurrentIndex(index);

    try {
      await video.play();
      addLog(index, 'playing');

      // 다음 영상을 타임라인 기준으로 예약
      if (index + 1 < PLAYLIST_URLS.length) {
        addLog(index + 1, 'scheduled');
        timeoutRef.current = window.setTimeout(() => {
          video.pause();
          playVideo(index + 1);
        }, intervalMs);
      } else {
        // 마지막 영상은 끝까지 재생
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

    // 모든 비디오 초기화
    videoRefs.current.forEach(v => {
      if (v) {
        v.pause();
        v.currentTime = 0;
        v.onended = null;
      }
    });

    await playVideo(0);
  };

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus('pending');
    setCurrentIndex(-1);
    setLogs([]);
    videoRefs.current.forEach(v => {
      if (v) {
        v.pause();
        v.currentTime = 0;
        v.onended = null;
      }
    });
  };

  const isRunning = status === 'running';

  return (
    <TestCard
      title="타임라인 기반 순차 재생"
      description="onended가 아닌 setTimeout으로 다음 영상 play() 호출"
    >
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        <strong>User Activation 만료 문제</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          브라우저는 <code>play()</code> 호출 시 <strong>User Activation</strong>(사용자 제스처) 여부를 확인합니다.
          클릭 이벤트 핸들러 내에서 직접 호출하면 허용되지만,
          <code>setTimeout</code> 콜백에서 호출하면 User Activation이 만료되어 차단될 수 있습니다.
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#92400e' }}>
          * 단, <code>onended</code> 이벤트는 "신뢰할 수 있는 이벤트"로 취급되어 예외적으로 허용됩니다.
        </p>
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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PLAYLIST_URLS.map((item, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              width: 180,
              border: currentIndex === i ? '2px solid #3b82f6' : '2px solid transparent',
              borderRadius: 6,
            }}
          >
            <video
              ref={el => { videoRefs.current[i] = el; }}
              src={item.url}
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                borderRadius: 4,
                backgroundColor: '#000',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11,
            }}>
              {i + 1}. {item.name}
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: '#f8f9fa',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'monospace',
          maxHeight: 150,
          overflow: 'auto',
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{
              color: log.status === 'blocked' ? '#dc2626' :
                     log.status === 'playing' ? '#059669' : '#f59e0b'
            }}>
              [{(log.time / 1000).toFixed(1)}s] {log.name}: {
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
