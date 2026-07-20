import { useState, type FormEvent } from 'react';
import type { AuthProfile, SetAuthProfilesInput, TargetDto } from '@dast/shared';
import { useSetAuthProfiles } from '../api';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/misc';
import { ApiError } from '../../../shared/api/http';

const PLACEHOLDER =
  '[{"name":"userA","headers":{"Authorization":"Bearer A"}},{"name":"userB","headers":{"Authorization":"Bearer B"}}]';

export function IdentitiesForm({ target }: { target: TargetDto }) {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useSetAuthProfiles(target.id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    let profiles: AuthProfile[];
    try {
      const parsed: unknown = JSON.parse(json || '[]');
      if (!Array.isArray(parsed)) throw new Error('expected a JSON array');
      profiles = parsed as AuthProfile[];
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`);
      return;
    }
    try {
      await mutation.mutateAsync({ authProfiles: profiles } satisfies SetAuthProfilesInput);
      setJson('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save identities');
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="text-secondary" style={{ marginTop: 0 }}>
        Identities let active checks act as real users. Two or more enable cross-user BOLA
        testing. Header values are stored server-side and never shown again.
      </p>
      {target.authProfileNames.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          Configured:{' '}
          {target.authProfileNames.map((n) => (
            <span key={n} className="method" style={{ marginRight: 6 }}>
              {n}
            </span>
          ))}
        </div>
      )}
      {error !== null && <div className="form-error">{error}</div>}
      <Field
        label="Identities (JSON)"
        htmlFor="identities"
        hint="Replaces the full set. Each item: { name, headers }."
      >
        <textarea
          id="identities"
          className="textarea"
          style={{ minHeight: 110 }}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={PLACEHOLDER}
        />
      </Field>
      <div className="row-between">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save identities'}
        </Button>
        {mutation.isSuccess && <span className="text-secondary">Saved.</span>}
      </div>
    </form>
  );
}
