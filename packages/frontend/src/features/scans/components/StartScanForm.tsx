import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScanProfile } from '@dast/shared';
import { useStartScan } from '../api';
import { Button } from '../../../shared/ui/Button';

export function StartScanForm({ targetId, disabled }: { targetId: string; disabled?: boolean }) {
  const navigate = useNavigate();
  const mutation = useStartScan(targetId);
  const [profile, setProfile] = useState<ScanProfile>('baseline');
  const [safeMode, setSafeMode] = useState(true);

  const start = async () => {
    const scan = await mutation.mutateAsync({ profile, safeMode });
    navigate(`/scans/${scan.id}`);
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
      <select
        className="input"
        style={{ width: 'auto' }}
        value={profile}
        onChange={(e) => setProfile(e.target.value as ScanProfile)}
      >
        <option value="baseline">Baseline — passive checks</option>
        <option value="full">Full — passive + active checks</option>
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-secondary">
        <input type="checkbox" checked={safeMode} onChange={(e) => setSafeMode(e.target.checked)} />
        Safe mode (no mutating requests)
      </label>
      <Button onClick={start} disabled={disabled || mutation.isPending}>
        {mutation.isPending ? 'Starting…' : 'Start scan'}
      </Button>
    </div>
  );
}
