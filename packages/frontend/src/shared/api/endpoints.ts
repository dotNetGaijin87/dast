import type {
  TargetDto,
  CreateTargetInput,
  ApiEndpointDto,
  ImportSpecInput,
  ImportSpecResult,
  SetAuthProfilesInput,
  StartScanInput,
  ScanDto,
  FindingDto,
} from '@dast/shared';
import { api } from './http';

export const targetsApi = {
  list: () => api<TargetDto[]>('/api/targets'),
  get: (id: string) => api<TargetDto>(`/api/targets/${id}`),
  create: (input: CreateTargetInput) =>
    api<TargetDto>('/api/targets', { method: 'POST', body: JSON.stringify(input) }),
  endpoints: (id: string) => api<ApiEndpointDto[]>(`/api/targets/${id}/endpoints`),
  importSpec: (id: string, input: ImportSpecInput) =>
    api<ImportSpecResult>(`/api/targets/${id}/specs`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  setAuth: (id: string, input: SetAuthProfilesInput) =>
    api<TargetDto>(`/api/targets/${id}/auth`, { method: 'PUT', body: JSON.stringify(input) }),
};

export const scansApi = {
  start: (targetId: string, input: StartScanInput) =>
    api<ScanDto>(`/api/targets/${targetId}/scans`, { method: 'POST', body: JSON.stringify(input) }),
  listForTarget: (targetId: string) => api<ScanDto[]>(`/api/targets/${targetId}/scans`),
  get: (id: string) => api<ScanDto>(`/api/scans/${id}`),
  findings: (id: string) => api<FindingDto[]>(`/api/scans/${id}/findings`),
};
