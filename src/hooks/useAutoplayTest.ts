import { useState, useRef, useCallback } from 'react';
import type { TestStatus } from '../types/autoplay';

export function useAutoplayTest() {
  const [status, setStatus] = useState<TestStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const reset = useCallback(() => {
    setStatus('pending');
    setError(null);
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
    }
  }, []);

  const runTest = useCallback(async (options?: {
    delayMs?: number;
  }) => {
    setStatus('running');
    setError(null);

    try {
      if (options?.delayMs) {
        await new Promise(r => setTimeout(r, options.delayMs));
      }

      const media = mediaRef.current;
      if (!media) throw new Error('Media element not found');

      await media.play();
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (
        message.includes('user gesture') ||
        message.includes('not allowed') ||
        message.includes('play() failed') ||
        message.includes('NotAllowedError') ||
        message.includes('AbortError')
      ) {
        setStatus('failed');
      } else {
        setStatus('error');
      }
      setError(message);
    }
  }, []);

  return { status, error, mediaRef, runTest, reset };
}
