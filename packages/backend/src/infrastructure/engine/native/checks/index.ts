import type { PassiveCheck } from '../types';
import { checkSecurityHeaders } from './securityHeaders';
import { checkCors } from './cors';
import { checkServerBanner } from './serverBanner';
import { checkInsecureTransport } from './insecureTransport';
import { checkCookieFlags } from './cookieFlags';
import { checkAuthEnforcement } from './authEnforcement';
import { checkInfoDisclosure } from './infoDisclosure';

/** Server-wide checks — run once against the base URL. */
export const SERVER_CHECKS: PassiveCheck[] = [
  checkSecurityHeaders,
  checkCors,
  checkServerBanner,
  checkInsecureTransport,
  checkCookieFlags,
  checkInfoDisclosure,
];

/** Per-endpoint checks — run against each probed operation. */
export const ENDPOINT_CHECKS: PassiveCheck[] = [checkAuthEnforcement, checkInfoDisclosure];

export {
  checkSecurityHeaders,
  checkCors,
  checkServerBanner,
  checkInsecureTransport,
  checkCookieFlags,
  checkAuthEnforcement,
  checkInfoDisclosure,
};
