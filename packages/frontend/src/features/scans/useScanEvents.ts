import { useEffect, useState } from 'react';
import { scanEventSchema, type ScanEvent, type ScanStatus, type FindingDto } from '@dast/shared';
import { API_BASE_URL } from '../../shared/api/http';

export interface LiveScanState {
  status: ScanStatus | null;
  progress: number;
  findings: FindingDto[];
  logs: string[];
}

const INITIAL: LiveScanState = { status: null, progress: 0, findings: [], logs: [] };

/** Subscribe to a scan's live SSE stream (progress, findings, logs). */
export function useScanEvents(scanId: string, enabled: boolean): LiveScanState {
  const [state, setState] = useState<LiveScanState>(INITIAL);

  useEffect(() => {
    if (!enabled) return;
    setState(INITIAL);
    const source = new EventSource(`${API_BASE_URL}/api/scans/${scanId}/events`);

    source.onmessage = (msg) => {
      let event: ScanEvent;
      try {
        event = scanEventSchema.parse(JSON.parse(msg.data));
      } catch {
        return;
      }
      setState((prev) => {
        switch (event.type) {
          case 'status':
            return { ...prev, status: event.status, progress: event.progress };
          case 'finding':
            return { ...prev, findings: [...prev.findings, event.finding] };
          case 'log':
            return { ...prev, logs: [...prev.logs.slice(-99), event.message] };
          default:
            return prev;
        }
      });
    };

    // EventSource reconnects automatically on transient errors.
    return () => source.close();
  }, [scanId, enabled]);

  return state;
}
