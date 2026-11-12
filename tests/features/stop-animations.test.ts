import { expect, it, vi } from 'vitest';
import { stopAnimations } from '../../src/features/stop-animations';
import { featureEngine } from '../helpers/feature-engine';
it('pauses autoplay only and removes media listeners when disabled', async () => {
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, 'pause')
    .mockImplementation(() => {});
  const video = document.createElement('video');
  video.autoplay = true;
  Object.defineProperty(video, 'paused', { value: false });
  const userVideo = document.createElement('video');
  Object.defineProperty(userVideo, 'paused', { value: false });
  document.body.append(video, userVideo);
  const before = document.documentElement.outerHTML,
    engine = featureEngine(stopAnimations);
  engine.set(false);
  engine.set(true);
  expect(pause).toHaveBeenCalledTimes(1);
  video.dispatchEvent(new Event('play'));
  expect(pause).toHaveBeenCalledTimes(2);
  userVideo.dispatchEvent(new Event('play'));
  expect(pause).toHaveBeenCalledTimes(2);
  engine.set(false);
  video.dispatchEvent(new Event('play'));
  expect(pause).toHaveBeenCalledTimes(2);
  expect(document.documentElement.outerHTML).toBe(before);
  engine.destroy();
  video.remove();
  userVideo.remove();
  vi.restoreAllMocks();
});
