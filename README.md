# Browser Autoplay Policy Test

브라우저의 자동 재생 정책(Autoplay Policy)을 테스트하는 앱입니다.

## 실행

```bash
npm install
npm run dev
```

## 테스트 항목

### 1. 자동 재생
페이지 로드 시 자동으로 재생 시도
- Muted Video: 대부분 허용
- Unmuted Video: 대부분 차단
- Audio: 대부분 차단

### 2. 지연 로딩
클릭 후 지연 시간이 지나면 사용자 인터랙션 컨텍스트가 만료되어 재생이 차단될 수 있음
- setTimeout 지연

### 3. 타임라인
onended가 아닌 setTimeout으로 N초 후 다음 영상 play()
- onended 특수성 검증

### 4. 사전 활성화
클릭 시 30개 video를 모두 play()→pause()로 활성화해야 하는 문제점 시연

### 5. 풀 재활용
3개 video 풀만 활성화하고 src 교체로 30개 영상 재생
- 리소스 절약

### 6. AudioContext (이론)
muted 비디오 + 별도 오디오 파일로 autoplay 제약 우회 가능
- 별도 오디오 파일 필요

## 기술 스택

- React + TypeScript
- Vite
