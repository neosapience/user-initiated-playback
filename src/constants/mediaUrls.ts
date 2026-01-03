// 작은 테스트 비디오 (오디오 트랙 포함)
export const MEDIA_URLS = {
  // ElephantsDream trailer - 약 10MB, 오디오 있음
  video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
} as const;

// 순차 재생 테스트용 플레이리스트 (각 15초, 오디오 있음)
export const PLAYLIST_URLS = [
  {
    name: 'Escapes',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15,
  },
  {
    name: 'Joyrides',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 15,
  },
  {
    name: 'Meltdowns',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: 15,
  },
] as const;
