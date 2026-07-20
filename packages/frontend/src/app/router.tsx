import { Routes, Route, Navigate } from 'react-router-dom';
import { TargetsPage } from '../features/targets/TargetsPage';
import { TargetDetailPage } from '../features/targets/TargetDetailPage';
import { ScanDetailPage } from '../features/scans/ScanDetailPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TargetsPage />} />
      <Route path="/targets/:id" element={<TargetDetailPage />} />
      <Route path="/scans/:id" element={<ScanDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
