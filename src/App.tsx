import { useState, useEffect, useRef } from 'react';
import {
  MutedVideoAutoplay,
  UnmutedVideoAutoplay,
  AudioAutoplay,
  SetTimeoutTest,
  TimelinePlayTest,
  PreactivatePlayTest,
  PooledPlayTest,
  AudioContextSyncTest,
} from './tests';
import './App.css';

const STEPS = [
  {
    title: '자동 재생',
    desc: '페이지 로드 시 자동으로 재생 시도',
    tests: ['muted', 'unmuted', 'audio'],
  },
  {
    title: '지연 로딩',
    desc: '클릭 후 지연 시간이 지나면 사용자 인터랙션 컨텍스트가 만료되어 재생이 차단될 수 있음',
    tests: ['setTimeout'],
  },
  {
    title: '타임라인',
    desc: 'onended가 아닌 setTimeout으로 N초 후 다음 영상 play() - onended 특수성 검증',
    tests: ['timeline'],
  },
  {
    title: '사전 활성화',
    desc: '클릭 시 30개 video를 모두 play()→pause()로 활성화해야 하는 문제점 시연',
    tests: ['preactivate'],
  },
  {
    title: '풀 재활용',
    desc: '3개 video 풀만 활성화하고 src 교체로 30개 영상 재생 - 리소스 절약',
    tests: ['pooled'],
  },
  {
    title: 'AudioContext (이론)',
    desc: 'muted 비디오 + 별도 오디오 파일로 autoplay 제약 우회 가능',
    tests: ['audiocontext'],
  },
];

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  // 쿼리 파라미터 확인
  const params = new URLSearchParams(window.location.search);
  const testType = params.get('test');

  // iframe 내부에서 실행되는 개별 테스트
  if (testType) {
    // 높이를 부모에게 전달
    useEffect(() => {
      const sendHeight = () => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
      };

      sendHeight();
      const observer = new ResizeObserver(sendHeight);
      observer.observe(document.body);

      return () => observer.disconnect();
    }, []);

    return (
      <div style={{ padding: 8 }}>
        {testType === 'muted' && <MutedVideoAutoplay />}
        {testType === 'unmuted' && <UnmutedVideoAutoplay />}
        {testType === 'audio' && <AudioAutoplay />}
        {testType === 'setTimeout' && <SetTimeoutTest />}
        {testType === 'timeline' && <TimelinePlayTest />}
        {testType === 'preactivate' && <PreactivatePlayTest />}
        {testType === 'pooled' && <PooledPlayTest />}
        {testType === 'audiocontext' && <AudioContextSyncTest />}
      </div>
    );
  }

  const step = STEPS[currentStep];

  // 메인 페이지: Step 기반 네비게이션
  return (
    <div className="app">
      <main>
        <section>
          <h2>{step.title}</h2>
          <p className="section-desc">{step.desc}</p>
          <div className="iframe-grid">
            {step.tests.map((test) => (
              <IframeTest key={test} src={`/?test=${test}`} />
            ))}
          </div>
        </section>
      </main>

      {/* 네비게이션 버튼 */}
      <div className="step-nav">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          이전
        </button>
        <span className="step-count">{currentStep + 1} / {STEPS.length}</span>
        <button
          onClick={() => setCurrentStep((s) => s + 1)}
          disabled={currentStep === STEPS.length - 1}
        >
          다음
        </button>
      </div>
    </div>
  );
}

function IframeTest({ src }: { src: string }) {
  const [height, setHeight] = useState(200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'resize' && iframeRef.current) {
        if (e.source === iframeRef.current.contentWindow) {
          setHeight(e.data.height);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{
        width: '100%',
        height,
        border: 'none',
        borderRadius: 8,
        backgroundColor: '#fff',
      }}
    />
  );
}

export default App;
