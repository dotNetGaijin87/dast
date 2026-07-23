import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StartScanInput } from '@dast/shared';
import { scansApi } from '../../shared/api/endpoints';

export const scanKeys = {
  forTarget: (targetId: string) => ['targets', targetId, 'scans'] as const,
  detail: (id: string) => ['scans', id] as const,
  findings: (id: string) => ['scans', id, 'findings'] as const,
};

export function useScans(targetId: string) {
  return useQuery({
    queryKey: scanKeys.forTarget(targetId),
    queryFn: () => scansApi.listForTarget(targetId),
  });
}

/** Poll every 2s only while the scan is still active; stop once it settles. */
export function useScan(id: string) {
  return useQuery({
    queryKey: scanKeys.detail(id),
    queryFn: () => scansApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'running' ? 2_000 : false;
    },
  });
}

export function useFindings(id: string, enabled: boolean) {
  return useQuery({
    queryKey: scanKeys.findings(id),
    queryFn: () => scansApi.findings(id),
    enabled,
  });
}

export function useStartScan(targetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartScanInput) => scansApi.start(targetId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: scanKeys.forTarget(targetId) }),
  });
}
