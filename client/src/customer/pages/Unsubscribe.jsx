import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('Processing your unsubscribe request…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('This unsubscribe link is invalid.');
      return;
    }
    api.get(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((result) => {
        setState('success');
        setMessage(result?.message || 'You have been unsubscribed successfully.');
      })
      .catch((error) => {
        setState('error');
        setMessage(error?.message || 'This unsubscribe link is invalid or could not be processed.');
      });
  }, [params]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16 text-center">
      <section className="w-full rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-2xl" aria-hidden="true">
          {state === 'loading' ? '…' : state === 'success' ? '✓' : '!'}
        </div>
        <h1 className="text-2xl font-bold">{state === 'success' ? 'Unsubscribed' : state === 'error' ? 'Unable to unsubscribe' : 'Please wait'}</h1>
        <p className="mt-3 text-muted">{message}</p>
        <Link className="mt-6 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-primary-fg" to="/">Back to Shajghor</Link>
      </section>
    </main>
  );
}
