import Widget from './widget';
/** Keep the page a Server Component and isolate effects at the client boundary. */
export default function Page() {
  return (
    <main>
      <h1>Packed App Router integration</h1>
      <p>This text is server-rendered.</p>
      <Widget />
    </main>
  );
}
