export async function fetchWithDelay(url: string, delayMs: number): Promise<string> {
  const startTime = Date.now();

  const response = await fetch(url);
  const blob = await response.blob();

  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, delayMs - elapsed);

  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  return URL.createObjectURL(blob);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
