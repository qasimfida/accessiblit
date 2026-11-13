# Packed Next App Router consumer

Build and pack the repository, rename the archive to `examples/accessiblit.tgz`, then run `npm install`, `npm run build` and `npm start` here. The example uses Next's production webpack build and server, not a mocked App Router.

`app/page.tsx` remains a Server Component. `app/widget.tsx` declares `'use client'` and mounts the optional `/react` component. The widget renders null on the server and creates its isolated DOM only after hydration. The button exercises real unmount/remount cleanup. No fonts or remote assets are requested by this example. The smoke harness disables framework telemetry during build/start.
