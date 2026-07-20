import {
  OWASP_API_TITLES,
  SEVERITIES_DESC,
  emptySeverityCounts,
  type FindingDto,
  type ScanDto,
} from '@dast/shared';

function triggerDownload(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(scan: ScanDto, findings: FindingDto[], targetName: string): void {
  const payload = { target: targetName, generatedAt: new Date().toISOString(), scan, findings };
  triggerDownload(`dast-scan-${scan.id}.json`, 'application/json', JSON.stringify(payload, null, 2));
}

export function downloadHtml(scan: ScanDto, findings: FindingDto[], targetName: string): void {
  triggerDownload(`dast-report-${scan.id}.html`, 'text/html', buildHtmlReport(scan, findings, targetName));
}

function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtmlReport(scan: ScanDto, findings: FindingDto[], targetName: string): string {
  const sev = emptySeverityCounts();
  for (const f of findings) sev[f.severity] += 1;

  const sevCards = SEVERITIES_DESC.map(
    (s) => `<div class="tile t-${s}"><div class="v">${sev[s]}</div><div class="l">${s}</div></div>`,
  ).join('');

  const rows = findings
    .map(
      (f) => `<tr>
        <td><span class="sev s-${esc(f.severity)}">${esc(f.severity)}</span></td>
        <td><strong>${esc(f.title)}</strong><div class="desc">${esc(f.description)}</div>${
          f.remediation ? `<div class="rem"><b>Remediation:</b> ${esc(f.remediation)}</div>` : ''
        }</td>
        <td class="mono">${esc(f.method ?? '')} ${esc(f.path ?? '')}</td>
        <td>${esc(f.owaspCategory)}<div class="muted">${esc(OWASP_API_TITLES[f.owaspCategory])}</div></td>
        <td class="muted">${esc(f.engine)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DAST report — ${esc(targetName)}</title>
<style>
  :root{color-scheme:light}
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#f9f9f7;color:#0b0b0b}
  .wrap{max-width:960px;margin:0 auto;padding:28px 22px 64px}
  h1{font-size:22px;margin:0 0 4px}
  .meta{color:#52514e;font-size:13px;margin-bottom:20px}
  .tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px}
  .tile{border:1px solid #e1e0d9;border-left-width:3px;border-radius:7px;padding:10px 12px;background:#fff}
  .tile .v{font-size:24px;font-weight:700}.tile .l{font-size:12px;color:#898781;text-transform:capitalize}
  .t-critical{border-left-color:#d03b3b}.t-high{border-left-color:#ec835a}.t-medium{border-left-color:#fab219}
  .t-low{border-left-color:#0ca30c}.t-info{border-left-color:#898781}
  table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e1e0d9;border-radius:8px;overflow:hidden}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top}
  th{background:#f3f3f0;color:#52514e}
  .desc{color:#52514e;margin-top:3px}.rem{margin-top:4px}.muted{color:#898781;font-size:12px}
  .mono{font-family:ui-monospace,monospace;font-size:12px}
  .sev{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;text-transform:capitalize;border:1px solid #ddd}
  .s-critical{color:#d03b3b}.s-high{color:#ec835a}.s-medium{color:#b6810a}.s-low{color:#0ca30c}.s-info{color:#6c6b66}
</style></head><body><div class="wrap">
  <h1>DAST scan report</h1>
  <div class="meta"><strong>${esc(targetName)}</strong> · profile ${esc(scan.profile)} · status ${esc(
    scan.status,
  )} · ${findings.length} findings · generated ${esc(new Date().toLocaleString())}</div>
  <div class="tiles">${sevCards}</div>
  <table><thead><tr><th>Severity</th><th>Finding</th><th>Location</th><th>OWASP</th><th>Engine</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5">No findings.</td></tr>'}</tbody></table>
</div></body></html>`;
}
