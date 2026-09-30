# Xweather Weather API OpenAPI specs

OpenAPI specs for the Vaisala Xweather
[Weather API](https://www.xweather.com/docs/weather-api). Browse them in the
[interactive reference](https://vaisala-xweather.github.io/openapi/), or
[open an issue](https://github.com/vaisala-xweather/openapi/issues) if
something is wrong or missing.

## Files

| File | OpenAPI version | Notes |
| --- | --- | --- |
| [`weather-api.yaml`](weather-api.yaml) | 3.2.0 | 58 endpoint groups, 236 operations. |
| [`weather-api-3.1.yaml`](weather-api-3.1.yaml) | 3.1.0 | Same operations, for tools that don't read 3.2 yet. |

Each file is self-contained and carries the MIT license notice. Both are also
served from the reference site, for example
`https://vaisala-xweather.github.io/openapi/weather-api.yaml`.

The specs are generated from the Weather API documentation, the API source
code and recorded API responses. Which endpoints you can call depends on your
subscription.

## Authentication and responses

Every request needs `client_id` and `client_secret` as query parameters. See
the [authentication guide](https://www.xweather.com/docs/weather-api/getting-started/authentication)
for details. Don't commit keys to this repo or paste them into LLM prompts.

A 200 response can still be an error, so check the `success` and `error`
fields. Responses are JSON unless the operation's docs say otherwise.

## Local development

Requires Node.js 22.12+, npm 10+ and Python 3 (for the preview server).

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run preview
```

The install flags keep third-party code from running on your machine and limit
what npm sends and prints during setup.

`npm run check` runs the full Spectral ruleset tests from `tests/`, then Redocly
and Spectral against both specs. Redocly
is used for the structural checks because the currently pinned Spectral version can't validate
OpenAPI 3.2.

After `npm run preview`, then open `http://localhost:8080`. The
page will pull a [Scalar](https://github.com/scalar/scalar) release from
jsDelivr.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The OpenAPI specifications and their embedded documentation and examples are
licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Vaisala Xweather.

API access, subscriptions and weather data delivered by the API remain governed
by the applicable service and data terms. This license does not grant rights to
the API implementation or to Xweather or Vaisala trademarks. Retain the copyright
and permission notice when redistributing copies or substantial portions of the
specifications.
