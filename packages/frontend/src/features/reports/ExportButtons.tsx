import type { FindingDto, ScanDto } from '@dast/shared';
import { Button } from '../../shared/ui/Button';
import { downloadHtml, downloadJson } from './export';

interface Props {
  scan: ScanDto;
  findings: FindingDto[];
  targetName: string;
}

export function ExportButtons({ scan, findings, targetName }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="secondary" onClick={() => downloadHtml(scan, findings, targetName)}>
        Export HTML
      </Button>
      <Button variant="ghost" onClick={() => downloadJson(scan, findings, targetName)}>
        Export JSON
      </Button>
    </div>
  );
}
