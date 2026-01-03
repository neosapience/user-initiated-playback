import { TestCard } from '../components/TestCard';

export function AudioContextSyncTest() {
  return (
    <TestCard
      title="AudioContext 동기화 (이론)"
      description="muted 비디오 + AudioContext 조합으로 autoplay 제약 우회"
    >
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <strong>핵심 아이디어:</strong><br />
          Video는 muted로 재생하고, 오디오는 AudioContext를 통해 별도 재생
        </div>

        <h4 style={{ marginBottom: 8 }}>장점</h4>
        <ul style={{ margin: '0 0 16px 0', paddingLeft: 20 }}>
          <li>Muted video는 autoplay 허용됨 → 활성화 불필요</li>
          <li>AudioContext는 최초 1회 클릭으로 unlock</li>
          <li>이후 모든 오디오를 자유롭게 재생 가능</li>
        </ul>

        <h4 style={{ marginBottom: 8 }}>구현 방법</h4>
        <ol style={{ margin: '0 0 16px 0', paddingLeft: 20 }}>
          <li>별도 오디오 파일 준비 (mp3, aac 등)</li>
          <li>사용자 클릭 시 <code>AudioContext.resume()</code></li>
          <li>Video는 muted로 재생 (영상만)</li>
          <li><code>fetch</code> → <code>decodeAudioData</code> → <code>AudioBufferSourceNode</code></li>
          <li><code>video.currentTime</code>과 오디오 싱크</li>
        </ol>

        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
        }}>
          <strong>제약:</strong><br />
          비디오와 별도의 오디오 파일이 필요합니다.
          같은 비디오 URL로 <code>decodeAudioData</code>를 쓰면
          전체 파일을 다운로드해야 하므로 비효율적입니다.
        </div>
      </div>
    </TestCard>
  );
}
