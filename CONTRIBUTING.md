# Contributing

Thanks for helping improve the Xweather Weather API OpenAPI descriptions.
Issues and pull requests are both welcome.

## Issues

Open an issue for anything that looks wrong or missing: parameters, schemas,
examples, descriptions or the reference page. Include the affected operation
(path and method, or `operationId`) and the behavior you expected.

## Pull requests

- Keep changes focused. Small pull requests are easier to review.
- If you change an operation, make the same change in both
  `weather-api.yaml` (OpenAPI 3.2) and `weather-api-3.1.yaml` (OpenAPI 3.1).
- Run the checks before opening the pull request. CI runs the same checks.

  ```sh
  npm ci --ignore-scripts --no-audit --no-fund
  npm run check
  ```

## Credentials and private data

Never include `client_id`, `client_secret` or other private data in issues,
pull requests or examples.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
