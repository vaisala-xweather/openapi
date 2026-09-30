const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

const root = path.resolve(__dirname, '..');
const temporary = mkdtempSync(path.join(tmpdir(), 'weather-api-spectral-'));
after(() => rmSync(temporary, { recursive: true, force: true }));
let sequence = 0;

// A small OpenAPI 3.2 contract using the Weather API's existing auth,
// underscore names, nullable fields and shared response/header references.
function document() {
  return {
    openapi: '3.2.0',
    info: {
      title: 'Weather API policy fixture', version: '1.0.0', description: 'Policy tests.',
      contact: { name: 'API team' }, license: { name: 'Proprietary' },
    },
    servers: [{ url: 'https://data.api.xweather.com' }],
    security: [{ clientId: [], clientSecret: [] }],
    tags: [{ name: 'observations', description: 'Observations.' }],
    paths: {
      '/observations/{location}': {
        get: {
          operationId: 'getObservationsByLocation',
          summary: 'Observations by location', description: 'Get observations.',
          tags: ['observations'],
          parameters: [
            { name: 'location', in: 'path', required: true, description: 'Location.', schema: { type: 'string' } },
            { name: 'client_id', in: 'query', description: 'Existing underscore name.', schema: { type: 'string' } },
          ],
          responses: {
            '200': { $ref: '#/components/responses/Success' },
            ...Object.fromEntries(['401', '404', '429', '500'].map(code => [
              code, { $ref: '#/components/responses/Error' },
            ])),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        clientId: { type: 'apiKey', in: 'query', name: 'client_id' },
        clientSecret: { type: 'apiKey', in: 'query', name: 'client_secret' },
      },
      headers: { Cost: { description: 'Cost.', schema: { type: 'integer' } } },
      responses: {
        Success: {
          description: 'Handled; inspect success and error.',
          headers: Object.fromEntries(['X-Cost-Endpoint', 'X-Cost-Multipliers', 'X-Cost-Tokens'].map(name => [
            name, { $ref: '#/components/headers/Cost' },
          ])),
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  error: { type: ['object', 'null'] },
                  response: { type: 'array', items: { type: 'object' } },
                },
              },
              example: { success: true, error: null, response: [] },
            },
          },
        },
        Error: { description: 'Failed request.' },
      },
    },
  };
}

const operation = spec => spec.paths['/observations/{location}'].get;

function run(cli, spec, args) {
  const filename = path.join(temporary, `${++sequence}.json`);
  writeFileSync(filename, JSON.stringify(spec));
  const result = spawnSync(process.execPath, [cli, 'lint', filename, ...args], {
    cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, REDOCLY_TELEMETRY: 'off' },
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, null, result.stderr);
  return result;
}

function lint(spec) {
  const result = run(path.join(root, 'node_modules/@stoplight/spectral-cli/dist/index.js'), spec, [
    '--ruleset', path.join(root, '.spectral.yaml'), '--format', 'json', '--quiet', '--fail-severity', 'error',
  ]);
  assert.notEqual(result.status, 2, result.stderr);
  return { ...result, diagnostics: JSON.parse(result.stdout) };
}

test('accepts the existing OpenAPI 3.2 contract, query auth and shared references', () => {
  const result = lint(document());
  assert.equal(result.status, 0, result.stdout);
  assert.deepEqual(result.diagnostics, []);
});

const failures = [
  ['HTTP production server', 'xweather-https-servers', spec => { spec.servers[0].url = 'http://data.api.xweather.com'; }],
  ['HTTP path server override', 'xweather-https-servers', spec => { spec.paths['/observations/{location}'].servers = [{ url: 'http://example.com' }]; }],
  ['HTTP operation server override', 'xweather-https-servers', spec => { operation(spec).servers = [{ url: 'http://example.com' }]; }],
  ['missing global auth', 'xweather-security-required', spec => { delete spec.security; }],
  ['either credential instead of both', 'xweather-paired-credentials', spec => { spec.security = [{ clientId: [] }, { clientSecret: [] }]; }],
  ['empty global auth', 'xweather-paired-credentials', spec => { spec.security = []; }],
  ['anonymous operation override', 'xweather-paired-credentials', spec => { operation(spec).security = []; }],
  ['anonymous alternative', 'xweather-paired-credentials', spec => { operation(spec).security = [{ clientId: [], clientSecret: [] }, {}]; }],
  ['changed credential spelling', 'xweather-query-auth-schemes', spec => { spec.components.securitySchemes.clientId.name = 'client-id'; }],
  ['changed credential location', 'xweather-query-auth-schemes', spec => { spec.components.securitySchemes.clientSecret.in = 'header'; }],
  ['missing rate-limit response', 'xweather-common-responses', spec => { delete operation(spec).responses['429']; }],
  ['missing JSON response schema', 'xweather-json-response-schema', spec => { delete spec.components.responses.Success.content['application/json'].schema; }],
  ['missing shared cost header', 'xweather-cost-headers', spec => { delete spec.components.responses.Success.headers['X-Cost-Multipliers']; }],
  ['missing operation ID', 'operation-operationId', spec => { delete operation(spec).operationId; }],
  ['invalid tool name', 'xweather-tool-operation-id', spec => { operation(spec).operationId = 'get/weather'; }],
  ['oversized tool name', 'xweather-tool-operation-id', spec => { operation(spec).operationId = 'a'.repeat(65); }],
  ['missing operation description', 'operation-description', spec => { delete operation(spec).description; }],
  ['missing parameter description', 'oas3-parameter-description', spec => { delete operation(spec).parameters[0].description; }],
  ['duplicate operation IDs', 'operation-operationId-unique', spec => { spec.paths['/observations/{location}'].post = structuredClone(operation(spec)); }],
  ['missing path parameter', 'path-params', spec => { operation(spec).parameters.shift(); }],
  ['unresolved reference', 'invalid-ref', spec => { operation(spec).responses['200'] = { $ref: '#/components/responses/Missing' }; }],
];

for (const [name, rule, mutate] of failures) {
  test(`blocks ${name}`, () => {
    const spec = document();
    mutate(spec);
    const result = lint(spec);
    assert.equal(result.status, 1, result.stdout);
    assert.ok(result.diagnostics.some(item => item.code === rule && item.severity === 0), result.stdout);
  });
}

test('documentation warnings are reported without failing CI', () => {
  const spec = document();
  delete spec.info.contact;
  const result = lint(spec);
  assert.equal(result.status, 0, result.stdout);
  assert.ok(result.diagnostics.some(item => item.code === 'info-contact' && item.severity === 1));
});

test('Redocly rejects invalid response examples but permits schema-authorized extra fields', () => {
  const cli = path.join(root, 'node_modules/@redocly/cli/bin/cli.js');
  const args = ['--config', path.join(root, 'redocly.yaml'), '--format', 'json'];
  const spec = document();
  const media = spec.components.responses.Success.content['application/json'];
  media.example.newField = 'allowed by this schema';
  assert.equal(run(cli, spec, args).status, 0);
  media.example.success = 'true';
  const result = run(cli, spec, args);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /no-invalid-media-type-examples/);
});

test('Redocly validates 3.2 structure where Spectral schema validation is disabled', () => {
  const cli = path.join(root, 'node_modules/@redocly/cli/bin/cli.js');
  const args = ['--config', path.join(root, 'redocly.yaml'), '--format', 'json'];
  const spec = document();
  assert.equal(run(cli, spec, args).status, 0);
  spec.components.responses.Success.content['application/json'].schema.type = 'not-a-json-type';
  const result = run(cli, spec, args);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /struct/);
});
