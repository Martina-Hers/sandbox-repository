# GitHub Corporate Sandbox

Repositorio de practica para simular un flujo corporativo sin tocar produccion.

## Que practica

- GitHub Actions CI.
- Pull Requests y checks requeridos.
- Branch Protection / Rulesets.
- GitHub Projects.
- Dependabot.
- Dependency Review.
- CodeQL / code scanning.
- Secret scanning / push protection (segun disponibilidad del plan).
- CODEOWNERS y plantillas de Issues/PRs.

## Aplicacion

API Node.js sin dependencias externas iniciales:

- `GET /health`
- `POST /purchase-orders`

Una orden de mas de 10000 requiere `approvedBy`.

## Uso local

```bash
npm ci
npm run ci
npm start
```

Prueba de health:

```bash
curl http://localhost:3000/health
```

Prueba de orden:

```bash
curl -X POST http://localhost:3000/purchase-orders \
  -H 'content-type: application/json' \
  -d '{"amount":15000,"approvedBy":"manager@example.test"}'
```

## Flujo recomendado

```text
Issue -> Project -> feature branch -> Pull Request
      -> CI -> Dependency Review -> CodeQL
      -> Branch Protection -> Merge -> Done
                         ^
                         |
                    Dependabot
```

## Antes de subirlo a GitHub

1. Reemplaza `YOUR_GITHUB_USERNAME` en `.github/CODEOWNERS`.
2. Crea un repo nuevo y vacio; no uses un repositorio de produccion.
3. Sube este contenido a `main`.
4. Configura GitHub siguiendo `docs/github-settings.md`.
5. Ejecuta los labs de `docs/labs/` en orden.

## Regla de seguridad del laboratorio

No uses secretos reales, datos corporativos, endpoints productivos ni credenciales de servicios reales.
