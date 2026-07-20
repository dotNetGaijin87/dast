import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTargetInput, ImportSpecInput, SetAuthProfilesInput } from '@dast/shared';
import { targetsApi } from '../../shared/api/endpoints';

export const targetKeys = {
  all: ['targets'] as const,
  detail: (id: string) => ['targets', id] as const,
  endpoints: (id: string) => ['targets', id, 'endpoints'] as const,
};

export function useTargets() {
  return useQuery({ queryKey: targetKeys.all, queryFn: targetsApi.list });
}

export function useTarget(id: string) {
  return useQuery({
    queryKey: targetKeys.detail(id),
    queryFn: () => targetsApi.get(id),
    enabled: id.length > 0,
  });
}

export function useEndpoints(id: string) {
  return useQuery({ queryKey: targetKeys.endpoints(id), queryFn: () => targetsApi.endpoints(id) });
}

export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTargetInput) => targetsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: targetKeys.all }),
  });
}

export function useSetAuthProfiles(targetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetAuthProfilesInput) => targetsApi.setAuth(targetId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: targetKeys.detail(targetId) });
      void qc.invalidateQueries({ queryKey: targetKeys.all });
    },
  });
}

export function useImportSpec(targetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportSpecInput) => targetsApi.importSpec(targetId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: targetKeys.endpoints(targetId) });
      void qc.invalidateQueries({ queryKey: targetKeys.detail(targetId) });
      void qc.invalidateQueries({ queryKey: targetKeys.all });
    },
  });
}
