import { useState, type FormEvent } from 'react';
import { useCreateTarget } from '../api';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/misc';
import { ApiError } from '../../../shared/api/http';

export function CreateTargetForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [scope, setScope] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateTarget();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const scopeHosts = scope
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await mutation.mutateAsync({
        name,
        baseUrl,
        ...(scopeHosts.length > 0 ? { scopeHosts } : {}),
      });
      setName('');
      setBaseUrl('');
      setScope('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create target');
    }
  };

  return (
    <form onSubmit={submit}>
      {error !== null && <div className="form-error">{error}</div>}
      <Field label="Name" htmlFor="t-name">
        <input
          id="t-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Payments API (staging)"
          required
        />
      </Field>
      <Field label="Base URL" htmlFor="t-url" hint="The running application to test.">
        <input
          id="t-url"
          className="input"
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://staging.example.com"
          required
        />
      </Field>
      <Field
        label="Authorized scope hosts"
        htmlFor="t-scope"
        hint="Comma-separated hostnames the scanner may reach. Defaults to the base URL host."
      >
        <input
          id="t-scope"
          className="input"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="staging.example.com"
        />
      </Field>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating…' : 'Create target'}
      </Button>
    </form>
  );
}
