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

const POOL_SIZE = 3;
const POOL_COLORS = ['#ef4444', '#3b82f6', '#22c55e']; // red, blue, green
const POOL_NAMES = ['A', 'B', 'C'];

type PoolState = {
  currentSrcIndex: number | null;
  isPlaying: boolean;
  isPreparing: boolean;
  preparingUrlName: string | null;
};

export function PooledPlayTest() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);
  const [poolStates, setPoolStates] = useState<PoolState[]>(
    Array(POOL_SIZE).fill(null).map(() => ({
      currentSrcIndex: null,
      isPlaying: false,
      isPreparing: false,
      preparingUrlName: null,
    }))
  );
  const [playHistory, setPlayHistory] = useState<{ playlistIndex: number; poolIndex: number; srcChanged: boolean; urlName: string }[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(1);
  const [activated, setActivated] = useState(false);

  const poolRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 로그 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [playHistory]);

  // 순차적으로 풀을 돌려가며 사용 (0→1→2→0→1→2...)
  const getPoolIndexForPlaylist = (playlistIndex: number) => {
    return playlistIndex % POOL_SIZE;
  };

  // 각 풀이 서로 다른 시점에 URL 변경되도록 엇갈리게 배치
  // Pool A: #1→URL0, #4→URL1, #7→URL2...
  // Pool B: #2→URL1, #5→URL2, #8→URL0...
  // Pool C: #3→URL2, #6→URL0, #9→URL1...
  const getUrlIndexForPlaylist = (playlistIndex: number) => {
    const poolIndex = playlistIndex % POOL_SIZE;
    const rotation = Math.floor(playlistIndex / POOL_SIZE);
    return (poolIndex + rotation) % PLAYLIST_URLS.length;
  };

  const updatePoolState = (poolIndex: number, update: Partial<PoolState>) => {
    setPoolStates(prev => prev.map((state, i) =>
      i === poolIndex ? { ...state, ...update } : state
    ));
  };

  // 다음 영상을 미리 준비 (src 변경 + 로딩)
  const prepareNextVideo = (nextPlaylistIndex: number) => {
    if (nextPlaylistIndex >= EXTENDED_PLAYLIST.length) return;

    const nextPoolIndex = getPoolIndexForPlaylist(nextPlaylistIndex);
    const nextUrlIndex = getUrlIndexForPlaylist(nextPlaylistIndex);
    const nextVideo = poolRefs.current[nextPoolIndex];
    if (!nextVideo) return;

    const nextSrc = PLAYLIST_URLS[nextUrlIndex].url;
    const nextUrlName = PLAYLIST_URLS[nextUrlIndex].name;

    // src가 다를 때만 변경
    if (nextVideo.src !== nextSrc) {
      nextVideo.src = nextSrc;
      nextVideo.load();
    }

    updatePoolState(nextPoolIndex, {
      isPreparing: true,
      preparingUrlName: nextUrlName,
    });
  };

  const playVideo = async (playlistIndex: number) => {
    if (playlistIndex >= EXTENDED_PLAYLIST.length) {
      setStatus('success');
      // 모든 풀 상태 초기화
      setPoolStates(prev => prev.map(s => ({
        ...s,
        isPlaying: false,
        isPreparing: false,
        preparingUrlName: null,
      })));
      return;
    }

    const poolIndex = getPoolIndexForPlaylist(playlistIndex);
    const video = poolRefs.current[poolIndex];
    if (!video) return;

    // 이전 풀의 재생 상태 해제, 현재 풀의 준비 상태 해제
    setPoolStates(prev => prev.map((s, i) => ({
      ...s,
      isPlaying: false,
      isPreparing: i === poolIndex ? false : s.isPreparing,
      preparingUrlName: i === poolIndex ? null : s.preparingUrlName,
    })));

    setCurrentPlaylistIndex(playlistIndex);

    // src 변경 (미리 준비되지 않은 경우에만)
    const urlIndex = getUrlIndexForPlaylist(playlistIndex);
    const newSrc = PLAYLIST_URLS[urlIndex].url;
    const srcChanged = video.src !== newSrc;

    if (srcChanged) {
      video.src = newSrc;
      video.load();
    }
    video.currentTime = 0;

    updatePoolState(poolIndex, { currentSrcIndex: playlistIndex, isPlaying: true });

    try {
      await video.play();
      setPlayHistory(prev => [...prev, {
        playlistIndex,
        poolIndex,
        srcChanged,
        urlName: PLAYLIST_URLS[urlIndex].name
      }]);

      // 다음 영상 미리 준비
      prepareNextVideo(playlistIndex + 1);

      // 다음 영상 재생 예약
      timeoutRef.current = window.setTimeout(() => {
        video.pause();
        playVideo(playlistIndex + 1);
      }, intervalSeconds * 1000);
    } catch (err) {
      console.log(`Play failed at ${playlistIndex}:`, err);
      setStatus('failed');
    }
  };

  const handleStart = async () => {
    setStatus('running');
    setPlayHistory([]);
    setCurrentPlaylistIndex(-1);

    // 풀 3개만 사전 활성화
    for (let i = 0; i < POOL_SIZE; i++) {
      const video = poolRefs.current[i];
      if (!video) continue;

      // 첫 번째 영상 src 설정
      video.src = EXTENDED_PLAYLIST[i % EXTENDED_PLAYLIST.length].url;
      video.load();

      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch (err) {
        console.log(`Pool ${i} activation failed:`, err);
      }
    }

    setActivated(true);

    // 재생 시작
    setTimeout(() => playVideo(0), 100);
  };

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('pending');
    setCurrentPlaylistIndex(-1);
    setPoolStates(Array(POOL_SIZE).fill(null).map(() => ({
      currentSrcIndex: null,
      isPlaying: false,
      isPreparing: false,
      preparingUrlName: null,
    })));
    setPlayHistory([]);
    setActivated(false);
    poolRefs.current.forEach(v => {
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    });
  };

  const isRunning = status === 'running';

  return (
    <TestCard
      title="풀 재활용 테스트 (3개)"
      description={`${POOL_SIZE}개 video만 활성화하고 src 교체로 ${EXTENDED_PLAYLIST.length}개 재생`}
    >
      {/* 개선점 설명 */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#dcfce7',
        border: '1px solid #22c55e',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
      }}>
        <strong>개선:</strong> {EXTENDED_PLAYLIST.length}개 영상을 재생하지만,
        <strong> {POOL_SIZE}개 video 엘리먼트만 활성화</strong>하고 src를 교체하며 재사용합니다.
        {activated && (
          <span style={{ color: '#059669', marginLeft: 8 }}>
            ✓ {POOL_SIZE}개 풀 활성화 완료
          </span>
        )}
      </div>

      {/* Video Pool 시각화 */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'flex-start',
      }}>
        {Array.from({ length: POOL_SIZE }).map((_, poolIndex) => {
          const state = poolStates[poolIndex];
          const color = POOL_COLORS[poolIndex];
          const isPlaying = state.isPlaying;
          const isPreparing = state.isPreparing;
          const isIdle = !isPlaying && !isPreparing;

          // 아무것도 재생 중이 아니면 0번 풀을 메인으로 표시
          const nothingPlaying = !poolStates.some(s => s.isPlaying);
          const isMain = isPlaying || (nothingPlaying && poolIndex === 0);

          return (
            <div
              key={poolIndex}
              style={{
                flex: isMain ? '1 1 auto' : '0 0 60px',
                minWidth: isMain ? 120 : 60,
                maxWidth: isMain ? 300 : 60,
                order: isMain ? -1 : isPreparing ? 0 : 1,
                border: isMain
                  ? `2px solid ${color}`
                  : isPreparing
                    ? `2px solid ${color}`
                    : '1px solid #e5e7eb',
                borderRadius: 6,
                padding: 4,
                backgroundColor: isMain || isPreparing ? `${color}10` : '#fff',
                opacity: isIdle && !isMain ? 0.5 : 1,
              }}
            >
              {/* 헤더 - 단순화 */}
              <div style={{
                height: 18,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 10,
                  lineHeight: '14px',
                  color: '#fff',
                  backgroundColor: color,
                  padding: '2px 6px',
                  borderRadius: 3,
                  fontWeight: 600,
                }}>
                  {isPlaying
                    ? `▶ ${state.currentSrcIndex !== null ? EXTENDED_PLAYLIST[state.currentSrcIndex].name : ''}`
                    : isPreparing
                      ? '다음'
                      : '대기'}
                </span>
              </div>

              {/* 비디오 - 16:9 비율 유지 */}
              <div style={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                backgroundColor: '#000',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <video
                  ref={el => { poolRefs.current[poolIndex] = el; }}
                  playsInline
                  preload="metadata"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
          );
        })}
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

      {/* 플레이리스트 시각화 - 어떤 풀이 담당하는지 색상으로 표시 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          플레이리스트 (색상 = 담당 풀)
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
        }}>
          {EXTENDED_PLAYLIST.map((_, i) => {
            const poolIndex = getPoolIndexForPlaylist(i);
            const color = POOL_COLORS[poolIndex];
            const isPlayed = playHistory.some(h => h.playlistIndex === i);
            const isCurrent = currentPlaylistIndex === i;

            return (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  backgroundColor: isPlayed ? color : isCurrent ? color : `${color}30`,
                  border: isCurrent ? `2px solid ${color}` : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  color: isPlayed || isCurrent ? '#fff' : color,
                  transition: 'all 0.2s',
                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* 재생 로그 */}
      {playHistory.length > 0 && (
        <div
          ref={logContainerRef}
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: 150,
            overflow: 'auto',
          }}
        >
          {playHistory.map((log, i) => (
            <div key={i} style={{ color: POOL_COLORS[log.poolIndex] }}>
              #{log.playlistIndex + 1} → Pool {POOL_NAMES[log.poolIndex]} ({log.urlName})
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
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
