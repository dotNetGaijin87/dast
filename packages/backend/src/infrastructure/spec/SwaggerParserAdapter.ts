import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import type { HttpMethod } from '@dast/shared';
import type {
  SpecParser,
  SpecParserInput,
  ParsedSpec,
  ParsedEndpoint,
} from '../../application/ports/SpecParser';
import { ValidationError } from '../../domain/errors/DomainError';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

export class SwaggerParserAdapter implements SpecParser {
  async parse(input: SpecParserInput): Promise<ParsedSpec> {
    try {
      const source = input.specUrl ?? (await this.rawToTempFile(input.spec ?? ''));
      const cleanup = input.specUrl ? undefined : source;
      try {
        // dereference resolves $refs and validates the document structure.
        const api = (await SwaggerParser.dereference(source)) as OpenAPIV3.Document;
        return this.extract(api);
      } finally {
        if (cleanup) await unlink(cleanup).catch(() => undefined);
      }
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw new ValidationError(`Failed to parse OpenAPI spec: ${(err as Error).message}`);
    }
  }

  /**
   * swagger-parser accepts a file path or an object. To support raw JSON *or*
   * YAML text uniformly we write it to a temp file and let the parser sniff it.
   */
  private async rawToTempFile(raw: string): Promise<string> {
    const trimmed = raw.trim();
    if (trimmed.length === 0) throw new ValidationError('Empty OpenAPI spec.');
    const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
    const file = join(tmpdir(), `dast-spec-${randomUUID()}.${isJson ? 'json' : 'yaml'}`);
    await writeFile(file, raw, 'utf8');
    return file;
  }

  private extract(api: OpenAPIV3.Document): ParsedSpec {
    const globalSecurity = Array.isArray(api.security) && api.security.length > 0;
    const endpoints: ParsedEndpoint[] = [];
    const paths = api.paths ?? {};

    for (const [path, item] of Object.entries(paths)) {
      if (!item) continue;
      const operations = item as Record<string, OpenAPIV3.OperationObject | undefined>;
      for (const method of METHODS) {
        const op = operations[method.toLowerCase()];
        if (!op) continue;
        const secured = op.security ? op.security.length > 0 : globalSecurity;
        endpoints.push({
          method,
          path,
          operationId: op.operationId ?? null,
          summary: op.summary ?? null,
          secured,
        });
      }
    }

    const title = api.info?.title ?? 'Untitled API';
    const version = api.info?.version ?? '0.0.0';
    return { apiTitle: title, apiVersion: version, endpoints };
  }
}
