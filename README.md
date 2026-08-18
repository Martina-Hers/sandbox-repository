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

- Testeeeee

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

## Dato interesante:
"GitHub Agentic Workflows" actualmente en public preview. Permite definir automatizaciones de repositorio mediante instrucciones en lenguaje natural ejecutadas por agentes dentro de GitHub Actions. Por ejemplo: clasificar Issues automáticamente, investigar fallos de CI, mantener documentación o generar reportes periódicos.
