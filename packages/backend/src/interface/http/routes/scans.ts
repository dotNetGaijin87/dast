import type { FastifyInstance } from 'fastify';
import { startScanSchema } from '@dast/shared';
import type { Container } from '../../composition/container';
import { toScanDto, toFindingDto } from '../../../application/mappers/toDto';

export function registerScanRoutes(app: FastifyInstance, c: Container): void {
  app.post('/api/targets/:id/scans', async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = startScanSchema.parse(req.body ?? {});
    const scan = await c.useCases.startScan.execute(id, input);
    return reply.code(202).send(toScanDto(scan));
  });

  app.get('/api/targets/:id/scans', async (req) => {
    const { id } = req.params as { id: string };
    const scans = await c.useCases.listScans.execute(id);
    return scans.map((s) => toScanDto(s, s.findingsCount, s.severityCounts));
  });

  app.get('/api/scans/:id', async (req) => {
    const { id } = req.params as { id: string };
    return toScanDto(await c.useCases.getScan.execute(id));
  });

  app.get('/api/scans/:id/findings', async (req) => {
    const { id } = req.params as { id: string };
    const findings = await c.useCases.listFindings.execute(id);
    return findings.map(toFindingDto);
  });
}
