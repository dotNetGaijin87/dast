import { useState, type FormEvent } from 'react';
import type { ImportSpecInput } from '@dast/shared';
import { useImportSpec } from '../targets/api';
import { Button } from '../../shared/ui/Button';
import { Field } from '../../shared/ui/misc';
import { ApiError } from '../../shared/api/http';

type Mode = 'paste' | 'url';

export function SpecImportForm({ targetId }: { targetId: string }) {
  const [mode, setMode] = useState<Mode>('paste');
  const [spec, setSpec] = useState('');
  const [specUrl, setSpecUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useImportSpec(targetId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const input: ImportSpecInput =
      mode === 'paste' ? { spec: spec.trim() } : { specUrl: specUrl.trim() };
    try {
      await mutation.mutateAsync(input);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to import spec');
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="button"
            variant={mode === 'paste' ? 'secondary' : 'ghost'}
            onClick={() => setMode('paste')}
          >
            Paste JSON / YAML
          </Button>
          <Button
            type="button"
            variant={mode === 'url' ? 'secondary' : 'ghost'}
            onClick={() => setMode('url')}
          >
            From URL
          </Button>
        </div>
      </div>

      {error !== null && <div className="form-error">{error}</div>}

      {mode === 'paste' ? (
        <Field label="OpenAPI specification" htmlFor="spec-text">
          <textarea
            id="spec-text"
            className="textarea"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder={'{\n  "openapi": "3.0.0",\n  ...\n}'}
            required
          />
        </Field>
      ) : (
        <Field label="Specification URL" htmlFor="spec-url">
          <input
            id="spec-url"
            className="input"
            type="url"
            value={specUrl}
            onChange={(e) => setSpecUrl(e.target.value)}
            placeholder="https://staging.example.com/openapi.json"
            required
          />
        </Field>
      )}

      <div className="row-between">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Importing…' : 'Import & parse'}
        </Button>
        {mutation.isSuccess && mutation.data && (
          <span className="text-secondary">
            Parsed <strong>{mutation.data.apiTitle}</strong> v{mutation.data.apiVersion} —{' '}
            {mutation.data.endpoints.length} endpoints.
          </span>
        )}
      </div>
    </form>
  );
}
