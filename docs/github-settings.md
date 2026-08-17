# Configuracion que se hace en GitHub y no vive solo en archivos

## 1. Branch protection / ruleset para `main`

Modo individual recomendado:
- Require a pull request before merging.
- Require status checks to pass before merging.
- Selecciona como requeridos:
  - `CI / validate`
  - `CodeQL / javascript-typescript`
  - `Dependency Review / scan`
- Block force pushes.
- Block deletions.
- No exijas aprobacion al inicio si eres la unica persona del repo.

Modo equipo:
- Todo lo anterior.
- Require 1 o 2 approving reviews.
- Dismiss stale approvals when new commits are pushed.
- Opcional: Require review from Code Owners.

## 2. Security

En Settings/Security habilita lo que tu plan y visibilidad del repositorio permitan:
- Dependency graph.
- Dependabot alerts.
- Dependabot security updates.
- Code scanning / CodeQL (si no usas el workflow avanzado incluido, usa default setup; no ambos a la vez).
- Secret scanning.
- Push protection, si esta disponible.

Nunca pruebes secret scanning con una credencial real.

## 3. GitHub Project

Crea un Project con estas vistas/campos:
- Status: Backlog, Ready, In Progress, In Review, Done.
- Priority: P0, P1, P2, P3.
- Sprint/Iteration.
- Size: XS, S, M, L.

Practica vinculando Issues y PRs. Usa `Closes #<numero>` en el PR.
