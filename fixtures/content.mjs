import { init } from '../src/index.ts';

const query = new globalThis.URLSearchParams(globalThis.location.search);
globalThis.contentInit = init;
globalThis.contentInstance = init({
  persist: query.has('persist'),
  storageKey: 'phase3:content',
});
