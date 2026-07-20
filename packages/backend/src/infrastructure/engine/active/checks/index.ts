import type { ActiveCheck } from '../types';
import { rateLimitingCheck } from './rateLimiting';
import { functionAuthzCheck } from './functionAuthz';
import { bolaCheck } from './bola';
import { massAssignmentCheck } from './massAssignment';

export const ACTIVE_CHECKS: ActiveCheck[] = [
  rateLimitingCheck,
  functionAuthzCheck,
  bolaCheck,
  massAssignmentCheck,
];

export { rateLimitingCheck, functionAuthzCheck, bolaCheck, massAssignmentCheck };
