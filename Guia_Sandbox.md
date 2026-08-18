# Guía técnica de práctica — GitHub Corporate Sandbox

## 1. Objetivo del repositorio

Este repositorio es un laboratorio aislado para practicar un flujo de trabajo corporativo en GitHub sin tocar repositorios productivos.

El flujo objetivo es:

```text
Issue
  ↓
GitHub Project
  ↓
Feature branch
  ↓
Pull Request
  ├── CI / GitHub Actions
  ├── Dependency Review
  └── CodeQL
  ↓
Branch Protection / Ruleset
  ↓
Revisión humana
  ↓
Merge a main
  ↓
Issue cerrado / Project en Done

Dependabot trabaja en paralelo creando PRs de actualización.
Secret Scanning vigila que no entren credenciales al repositorio.
```

La aplicación del laboratorio es una API Node.js pequeña para órdenes de compra. El objetivo real no es la API: la API existe para tener código, tests, dependencias y cambios sobre los cuales practicar GitHub.

---

## 2. Correcciones importantes antes de empezar

### 2.1 `.github/ISSUE_TEMPLATE/feature.yml`

Un archivo YAML de **GitHub Issue Forms** no usa `about:` como clave superior. Para los formularios YAML modernos se usa `description:`.

Si tienes esto:

```yaml
name: Feature
about: Solicitud de funcionalidad para practicar el flujo Issue -> Branch -> PR
```

GitHub mostrará un error parecido a:

```text
about is not a permitted key
```

Debes sustituirlo por:

```yaml
name: Feature
description: Solicitud de funcionalidad para practicar el flujo Issue -> Branch -> PR
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problema
      description: ¿Qué necesidad quieres resolver?
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: Criterios de aceptación
      description: ¿Cómo sabremos que el cambio está terminado?
    validations:
      required: true
```

> Nota: el label `enhancement` debe existir en el repositorio para que GitHub pueda aplicarlo automáticamente.

### 2.2 `.github/workflows/dependency-review.yml`

Debe existir este archivo:

```yaml
name: Dependency Review

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  dependency-review:
    name: Dependency Review / scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Review dependency changes
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
```

Este workflow compara las dependencias del commit base del Pull Request contra las del commit de la rama propuesta. Si el cambio introduce una dependencia vulnerable con severidad `high` o `critical`, el job falla.

Si después conviertes el check `Dependency Review / scan` en obligatorio mediante un Ruleset o Branch Protection, ese fallo puede impedir el merge.

---

## 3. Estructura técnica del repositorio

```text
sandbox-repository/
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── feature.yml
│   │
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── codeql.yml
│   │   └── dependency-review.yml
│   │
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   └── pull_request_template.md
│
├── docs/
│   ├── github-settings.md
│   └── labs/
│
├── scripts/
│   └── lint.mjs
│
├── src/
│   ├── server.js
│   └── services/
│       └── purchaseOrderService.js
│
├── test/
│   └── purchaseOrderService.test.js
│
├── .env.example
├── .gitignore
├── .nvmrc
├── CONTRIBUTING.md
├── README.md
├── SECURITY.md
├── package.json
└── package-lock.json
```

### Separación conceptual

| Zona | Responsabilidad |
|---|---|
| `src/` | Código de la aplicación. |
| `test/` | Pruebas automatizadas. |
| `scripts/` | Automatización local, por ejemplo lint. |
| `.github/workflows/` | CI y análisis ejecutados por GitHub Actions. |
| `.github/ISSUE_TEMPLATE/` | Estandariza la captura de requerimientos. |
| `.github/CODEOWNERS` | Define propietarios/revisores por ruta. |
| `.github/dependabot.yml` | Configura actualizaciones automáticas de dependencias. |
| `docs/` | Instrucciones y ejercicios del laboratorio. |

---

## 4. Preparación local

### 4.1 Comprobar Git

```bash
git --version
```

### 4.2 Comprobar Node.js

```bash
node --version
npm --version
```

El proyecto usa `.nvmrc` con Node 22.

Si utilizas `nvm`:

```bash
nvm install
nvm use
```

### 4.3 Instalar exactamente las dependencias del lockfile

```bash
npm ci
```

`npm ci` está pensado para instalaciones reproducibles en CI. A diferencia de `npm install`, espera un `package-lock.json` compatible y no debe reescribirlo para resolver versiones nuevas.

### 4.4 Ejecutar el mismo conjunto de validaciones que CI

```bash
npm run ci
```

Internamente ejecuta:

```text
npm run lint
    ↓
npm test
```

Antes de abrir un PR, acostúmbrate a ejecutar este comando localmente.

---

## 5. Qué hace técnicamente cada componente

### 5.1 GitHub Actions — CI

Archivo principal:

```text
.github/workflows/ci.yml
```

Conceptualmente:

```text
Evento GitHub
   ↓
pull_request o push
   ↓
Workflow
   ↓
Job
   ↓
Runner ubuntu-latest
   ↓
Steps
   ├── checkout
   ├── setup-node
   ├── npm ci
   ├── lint
   └── test
   ↓
Check result
```

Un **workflow** es la definición YAML completa.

Un **job** es una unidad de ejecución que se asigna a un runner.

Un **runner** es la máquina o entorno que ejecuta el job.

Un **step** es una acción reutilizable (`uses:`) o un comando de shell (`run:`).

El resultado final del job se publica como un **status check** en el commit/PR.

Ese check por sí solo informa. Se vuelve una barrera real de merge cuando Branch Protection o un Ruleset lo declara obligatorio.

---

### 5.2 Branch Protection / Repository Rulesets

Branch Protection no es código que se ejecute dentro de tu aplicación. Es una política que GitHub aplica **en el servidor** cuando alguien intenta actualizar una rama protegida.

Para `main`, una política típica de laboratorio es:

```text
Require a pull request before merging
Require status checks to pass
Block force pushes
Block deletions
```

Checks recomendados:

```text
CI / validate
CodeQL / javascript-typescript
Dependency Review / scan
```

#### Efecto técnico

Sin protección:

```text
git push origin main
       ↓
GitHub acepta el nuevo commit
```

Con protección:

```text
git push origin main
       ↓
Regla evalúa operación
       ↓
Push rechazado si viola la política
```

Para cambios normales se obliga el flujo:

```text
branch → PR → checks → review → merge
```

---

### 5.3 Pull Requests

Un Pull Request representa una propuesta para integrar una línea de commits en otra rama.

Ejemplo:

```text
base: main
head: feature/change-threshold
```

El PR es el punto donde convergen:

- diff de código;
- discusión;
- revisiones;
- status checks;
- Dependency Review;
- CodeQL;
- vínculo con Issues;
- reglas de merge.

La plantilla `.github/pull_request_template.md` estandariza la información que el autor debe proporcionar.

---

### 5.4 CODEOWNERS

Archivo:

```text
.github/CODEOWNERS
```

Ejemplo:

```text
* @TU_USUARIO
.github/workflows/ @TU_USUARIO
.github/dependabot.yml @TU_USUARIO
```

GitHub compara los archivos modificados en el PR contra los patrones de CODEOWNERS y solicita revisión a los propietarios correspondientes.

Importante: CODEOWNERS puede solicitar reviewers, pero para convertir su aprobación en un requisito obligatorio debes combinarlo con una regla como **Require review from Code Owners**.

En equipo podrías usar:

```text
src/                 @equipo-backend
.github/workflows/   @equipo-devops
.github/dependabot.yml @equipo-security
```

---

### 5.5 GitHub Projects

Projects es la capa de gestión del trabajo.

No modifica Git, no compila código y no decide por sí mismo si un merge es válido.

Sirve para representar metadatos de planificación alrededor de Issues y PRs:

```text
Backlog
Ready
In Progress
In Review
Done
```

Campos útiles:

```text
Priority: P0/P1/P2/P3
Size: XS/S/M/L
Iteration: Sprint 1, Sprint 2...
Owner
Target date
```

Su valor aparece cuando conectas el trabajo técnico con el trabajo planeado.

---

### 5.6 Dependabot

Archivo:

```text
.github/dependabot.yml
```

Dependabot puede trabajar en dos áreas relacionadas pero diferentes:

1. **Version updates**: busca versiones nuevas y abre PRs.
2. **Security alerts/updates**: usa el dependency graph y la GitHub Advisory Database para identificar dependencias vulnerables y proponer remediaciones cuando corresponda.

En este laboratorio se monitorean:

```text
npm
GitHub Actions
```

Cuando Dependabot abre un PR, ese PR debería pasar por los mismos controles que uno creado por una persona:

```text
Dependabot PR
   ↓
CI
   ↓
Dependency Review
   ↓
CodeQL
   ↓
Branch rules
   ↓
Merge
```

No trates un PR de Dependabot como automáticamente seguro solo porque lo creó un bot.

---

### 5.7 Dependency Review

Archivo:

```text
.github/workflows/dependency-review.yml
```

Dependency Review analiza el **delta de dependencias** introducido por un Pull Request.

Conceptualmente:

```text
Dependencias en base/main
          ↓
        DIFF
          ↑
Dependencias en la rama del PR
          ↓
Advisory / metadata analysis
          ↓
Pass o Fail
```

Esto es diferente de Dependabot Alerts:

- **Dependabot Alerts** pregunta: “¿ya tengo una dependencia vulnerable en la rama por defecto?”
- **Dependency Review** pregunta: “¿este PR está intentando introducir o actualizar una dependencia de forma riesgosa?”

---

### 5.8 CodeQL / Code Scanning

Archivo:

```text
.github/workflows/codeql.yml
```

CodeQL es análisis estático basado en una representación consultable del código.

Flujo conceptual:

```text
Código fuente
   ↓
CodeQL initialization
   ↓
Base de datos / representación del programa
   ↓
Queries de seguridad
   ↓
Resultados
   ↓
Code scanning alerts en GitHub
```

En este repo se analiza:

```text
javascript-typescript
```

El workflow usa permisos:

```yaml
permissions:
  contents: read
  security-events: write
```

`contents: read` permite leer el contenido del repo.

`security-events: write` permite que la acción publique los resultados en code scanning.

CodeQL es SAST: analiza propiedades del código sin depender de que la aplicación esté expuesta a tráfico real.

---

### 5.9 Secret Scanning y Push Protection

Secret Scanning busca patrones que representen credenciales y secretos.

Ejemplos conceptuales:

```text
API keys
access tokens
private keys
credentials
```

Push Protection agrega una barrera preventiva:

```text
git push
   ↓
GitHub inspecciona cambios
   ↓
¿posible secreto?
   ├── No → acepta si el resto de reglas lo permite
   └── Sí → bloquea o exige un flujo de bypass permitido
```

Nunca pruebes esto con credenciales reales.

El archivo `.gitignore` del laboratorio evita que `.env` se incluya normalmente en commits, mientras que `.env.example` sirve para documentar nombres de variables sin contener secretos.

---

## 6. Primer flujo de práctica en solitario

### Paso 1 — sincronizar `main`

```bash
git switch main
git pull origin main
```

### Paso 2 — crear un Issue

En GitHub:

```text
Issues → New issue → Feature
```

Ejercicio:

```text
Título: [Feature]: Cambiar límite de aprobación de órdenes

Problema:
Las órdenes mayores de 10,000 requieren aprobación.
Quiero experimentar con un límite de 12,000.

Criterios:
- Una orden de 11,000 pasa sin approvedBy.
- Una orden de 13,000 falla sin approvedBy.
- Una orden de 13,000 pasa con approvedBy.
```

Anota el número del Issue. Supongamos `#4`.

### Paso 3 — crear una rama

```bash
git switch -c feature/issue-4-approval-threshold
```

La rama es un puntero separado de `main`; tus commits de práctica no modifican `main` hasta que exista un merge.

### Paso 4 — cambiar código

Modifica únicamente lo necesario para cambiar el umbral y actualiza las pruebas correspondientes.

### Paso 5 — validar localmente

```bash
npm run ci
```

### Paso 6 — commit

```bash
git status
git add src test
git commit -m "Change purchase approval threshold"
```

### Paso 7 — push de la rama

```bash
git push -u origin feature/issue-4-approval-threshold
```

### Paso 8 — abrir Pull Request

Base:

```text
main
```

Compare/head:

```text
feature/issue-4-approval-threshold
```

En la descripción:

```text
Closes #4
```

Cuando el PR se mergee a la rama por defecto, GitHub podrá cerrar automáticamente el Issue relacionado.

### Paso 9 — observar los checks

Busca:

```text
CI / validate
CodeQL / javascript-typescript
Dependency Review / scan
```

No hagas merge de inmediato. Entra a cada ejecución y revisa:

- evento que la disparó;
- commit SHA;
- runner;
- steps;
- logs;
- duración;
- resultado.

### Paso 10 — provocar una falla de CI

En la misma rama, rompe deliberadamente una prueba o la lógica del umbral sin actualizar el test.

```bash
npm test
```

Confirma que falla localmente y súbelo solo al sandbox:

```bash
git add .
git commit -m "Lab: intentionally break a test"
git push
```

Observa que `CI / validate` falle.

Después corrígelo:

```bash
git add .
git commit -m "Fix failing threshold test"
git push
```

El mismo PR recibirá una nueva ejecución de Actions para el nuevo commit.

### Paso 11 — merge

Solo cuando los checks estén verdes realiza el merge.

Después:

```bash
git switch main
git pull origin main
git branch -d feature/issue-4-approval-threshold
```

---

## 7. Práctica específica de Dependency Review

Crea un Issue de laboratorio:

```text
Experimentar con una nueva dependencia npm
```

Crea una rama:

```bash
git switch main
git pull
git switch -c experiment/dependency-review
```

Instala una librería legítima que quieras estudiar:

```bash
npm install <paquete>
```

Revisa exactamente qué cambió:

```bash
git diff -- package.json package-lock.json
```

Commit y push:

```bash
git add package.json package-lock.json
git commit -m "Lab: add dependency for review"
git push -u origin experiment/dependency-review
```

Abre un PR y examina el check:

```text
Dependency Review / scan
```

Objetivo técnico: entender que la revisión trabaja sobre el cambio de dependencias del PR, no sobre cualquier línea de JavaScript modificada.

---

## 8. Práctica específica de Dependabot

Mantén `.github/dependabot.yml` en `main`.

Revisa en GitHub las opciones de seguridad y activa las que tu tipo de repositorio y plan permitan.

Cuando Dependabot abra un PR:

1. lee qué archivo modifica;
2. revisa la versión anterior y la propuesta;
3. revisa CI;
4. revisa Dependency Review;
5. revisa notas de release cuando corresponda;
6. haz merge solo si entiendes el cambio.

Esto simula el tratamiento corporativo de actualizaciones automatizadas.

---

## 9. Práctica específica de CodeQL

No necesitas introducir código peligroso para comprender el pipeline.

Primero estudia una ejecución normal:

```text
Actions → CodeQL → ejecución → Analyze
```

Luego revisa:

```text
Security / Security and quality → Code scanning
```

Si quieres experimentar con detecciones, hazlo únicamente en este sandbox y utiliza ejemplos deliberadamente sintéticos. No reutilices vulnerabilidades de laboratorio en aplicaciones reales.

Objetivo técnico:

```text
PR
 ↓
CodeQL analiza la nueva versión
 ↓
Resultado de seguridad asociado al commit/PR
 ↓
Ruleset puede exigir que el análisis finalice correctamente
```

---

## 10. Práctica de Secret Scanning sin secretos reales

### Nunca hagas esto

No utilices:

```text
PAT real
AWS key real
Azure secret real
password corporativo
API token real
private key real
```

Para practicar el concepto, revisa la configuración de Secret Scanning / Push Protection de GitHub y usa únicamente los mecanismos de prueba/documentación que GitHub permita para tu cuenta.

Tu disciplina local debe ser:

```bash
git status
git diff --cached
```

antes de cada commit.

Y verifica que `.env` siga ignorado:

```bash
git check-ignore -v .env
```

---

## 11. Flujo de práctica en equipo

Idealmente usa tres responsabilidades, aunque sean dos personas:

```text
Developer
Reviewer / Code Owner
Repository maintainer
```

### Configuración recomendada

Para `main`:

```text
Require a pull request before merging
Require 1 approving review
Dismiss stale approvals when new commits are pushed
Require status checks
Require conversation resolution
Block force pushes
Block deletions
```

Cuando ya entiendan el flujo:

```text
Require review from Code Owners
```

### Ejercicio de equipo

#### Persona A — Developer

1. toma un Issue;
2. se asigna el Issue;
3. mueve la tarjeta a `In Progress`;
4. crea una rama;
5. implementa;
6. ejecuta `npm run ci`;
7. abre PR;
8. mueve el trabajo a `In Review`.

#### Persona B — Reviewer

No debe limitarse a presionar Approve.

Debe revisar:

```text
¿El cambio resuelve el Issue?
¿Los tests cubren el comportamiento?
¿Se añadieron dependencias innecesarias?
¿Hay secretos o información sensible?
¿Los checks pasan?
¿El cambio tiene un riesgo no documentado?
```

Puede usar **Request changes**.

#### Persona A

Hace nuevos commits sobre la misma rama y responde las conversaciones.

#### GitHub

Vuelve a ejecutar workflows para el nuevo commit.

Si está activado `Dismiss stale approvals`, una aprobación anterior puede dejar de ser válida después de nuevos cambios.

#### Persona B

Revisa la nueva versión y aprueba.

#### Merge

Al mergearse:

```text
PR → merged
Issue → closed
Project → Done
```

Esta secuencia da trazabilidad entre necesidad, código, revisión, validación y entrega.

---

## 12. GitHub Projects para el ejercicio en equipo

Crea un Project con:

```text
Status
- Backlog
- Ready
- In Progress
- In Review
- Done
```

Agrega:

```text
Priority: P0, P1, P2, P3
Size: XS, S, M, L
Iteration: Sprint 1, Sprint 2...
```

Ejercicio de sprint:

```text
Issue #10 → P1 → M → Sprint 1 → Ready
        ↓
Developer lo toma
        ↓
In Progress
        ↓
PR #11
        ↓
In Review
        ↓
Checks + aprobación
        ↓
Merge
        ↓
Done
```

El Project sirve como capa de planificación; el PR sigue siendo la capa de integración técnica.

---

## 13. Configuración individual vs. configuración de equipo

### Modo individual

Úsalo cuando eres la única persona practicando.

Recomendado:

```text
Require PR before merge                  Sí
Require status checks                    Sí
Require approvals                        No al principio
Block force pushes                       Sí
Block deletions                          Sí
Require Code Owner review                No
```

Esto evita bloquearte por necesitar la aprobación de otra persona que no existe.

### Modo equipo

```text
Require PR before merge                  Sí
Require status checks                    Sí
Require 1 o 2 approvals                  Sí
Dismiss stale approvals                  Sí
Require conversation resolution          Sí
Block force pushes                       Sí
Block deletions                          Sí
Require Code Owner review                Opcional/recomendado
```

---

## 14. Diferencia entre las herramientas de seguridad

| Herramienta | Pregunta que responde |
|---|---|
| CI | ¿El código compila/valida y pasan las pruebas? |
| CodeQL | ¿El código presenta patrones de vulnerabilidad detectables estáticamente? |
| Dependency Review | ¿Este PR introduce dependencias nuevas o actualizadas con riesgo conocido? |
| Dependabot Alerts | ¿La rama por defecto ya contiene una dependencia con vulnerabilidad conocida? |
| Dependabot Version Updates | ¿Hay nuevas versiones de dependencias que podría actualizar mediante PR? |
| Secret Scanning | ¿Existe una credencial o secreto detectable en el contenido/historial que GitHub analiza? |
| Push Protection | ¿Debemos impedir que un secreto detectable entre mediante este push? |
| Branch Protection / Rulesets | ¿Está permitido actualizar/mergear esta rama bajo las políticas definidas? |

Ninguna herramienta sustituye completamente a las demás.

---

## 15. Troubleshooting

### Error: `about is not a permitted key`

Causa:

```yaml
about:
```

es incorrecto para un Issue Form YAML.

Solución:

```yaml
description:
```

Commit:

```bash
git add .github/ISSUE_TEMPLATE/feature.yml
git commit -m "Fix GitHub issue form schema"
git push
```

---

### `dependency-review.yml` no aparece en GitHub

Comprueba localmente:

```bash
ls -la .github/workflows
```

Después:

```bash
git status
git ls-files .github/workflows
```

Si no está trackeado:

```bash
git add .github/workflows/dependency-review.yml
git commit -m "Add dependency review workflow"
git push origin main
```

Si trabajas con `main` ya protegido, no hagas push directo. Usa:

```bash
git switch -c chore/add-dependency-review
git add .github/workflows/dependency-review.yml
git commit -m "Add dependency review workflow"
git push -u origin chore/add-dependency-review
```

Y abre un PR.

---

### Workflow existe pero no aparece en Actions

Verifica:

```bash
git ls-tree -r origin/main --name-only | grep .github/workflows
```

También verifica la pestaña Actions y si GitHub Actions está permitido para el repo/organización.

Algunos workflows solo se ejecutan ante eventos concretos. Por ejemplo, Dependency Review usa `pull_request`; subir el YAML no implica necesariamente que ya exista una ejecución de Dependency Review.

---

### No puedo seleccionar un required check

Normalmente primero debes conseguir que ese workflow/job produzca un check en el repositorio. Abre un PR de prueba, deja que se ejecute y vuelve a la configuración del Ruleset/Branch Protection.

---

### Dependency Review falla por disponibilidad/licencia

La disponibilidad cambia según si el repositorio es público, privado y las licencias de seguridad habilitadas en la organización.

Para un laboratorio personal sin contenido sensible, un repositorio público suele permitir practicar más funciones de GitHub Security sin licencias empresariales adicionales.

Nunca conviertas en público un repo que contenga código, datos o configuración corporativa.

---

### CodeQL no puede publicar resultados

Revisa que el workflow tenga:

```yaml
permissions:
  contents: read
  security-events: write
```

También verifica que Code Scanning esté disponible para ese repositorio y que no estés mezclando sin intención dos configuraciones diferentes de CodeQL, como default setup y un workflow avanzado propio.

---

### CODEOWNERS no solicita review

Revisa:

1. que el usuario/equipo exista;
2. que tenga permisos adecuados al repo;
3. que el patrón coincida con el archivo modificado;
4. que `CODEOWNERS` esté en una ubicación soportada;
5. si esperas enforcement, que el ruleset requiera Code Owner review.

---

## 16. Comandos Git esenciales del laboratorio

### Estado

```bash
git status
```

### Historial compacto

```bash
git log --oneline --graph --decorate --all
```

### Crear rama

```bash
git switch -c feature/mi-cambio
```

### Ver cambios antes de stage

```bash
git diff
```

### Agregar cambios

```bash
git add .
```

### Ver exactamente qué entrará al commit

```bash
git diff --cached
```

### Commit

```bash
git commit -m "Describe el cambio"
```

### Push inicial de rama

```bash
git push -u origin feature/mi-cambio
```

### Volver a main

```bash
git switch main
git pull origin main
```

### Borrar rama local después del merge

```bash
git branch -d feature/mi-cambio
```

---

## 17. Secuencia recomendada de laboratorios

### Nivel 1 — Git y PR

```text
Issue → branch → commit → push → PR → merge
```

### Nivel 2 — CI

```text
Provocar test fallido → observar Actions → corregir → verde
```

### Nivel 3 — Branch Protection

```text
Intentar merge con check fallido → comprobar bloqueo
```

### Nivel 4 — Projects

```text
Backlog → In Progress → In Review → Done
```

### Nivel 5 — Dependency Review

```text
Modificar package.json/package-lock.json → PR → analizar dependency diff
```

### Nivel 6 — Dependabot

```text
Recibir PR de bot → revisar → checks → merge
```

### Nivel 7 — CodeQL

```text
Ejecutar análisis → estudiar resultados → entender Security tab
```

### Nivel 8 — Secret Scanning

```text
Estudiar configuración y push protection sin usar ningún secreto real
```

### Nivel 9 — Equipo

```text
Developer → Reviewer → Request changes → nuevo commit → aprobación → merge
```

---

## 18. Regla de oro del sandbox

Este repositorio debe permanecer completamente separado de producción.

No agregues:

```text
URLs productivas privadas
credenciales reales
certificados reales
datos personales
información corporativa confidencial
copias de configuraciones productivas sensibles
```

Usa exclusivamente:

```text
datos sintéticos
usuarios ficticios
variables dummy
endpoints locales
código creado específicamente para práctica
```

---

## 19. Referencias oficiales

- GitHub Issue Forms syntax: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
- Dependency Review: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review
- Configure Dependency Review Action: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action
- Code scanning: https://docs.github.com/en/code-security/concepts/code-scanning/code-scanning
- Secret scanning: https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning
- Dependabot alerts: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts

---

## 20. Meta final del laboratorio

Cuando hayas terminado deberías ser capaz de explicar y ejecutar este flujo sin depender de memoria mecánica:

```text
Necesidad de negocio
       ↓
Issue estructurado
       ↓
Planificación en Project
       ↓
Rama aislada
       ↓
Commits pequeños
       ↓
Pull Request
       ↓
Automated checks
 ┌─────┼─────────────┐
 │     │             │
 CI  CodeQL   Dependency Review
 └─────┼─────────────┘
       ↓
Revisión humana
       ↓
Ruleset / Branch Protection
       ↓
Merge controlado
       ↓
main estable
       ↓
Dependabot + Security monitoring continuo
```

Ese modelo mental es más importante que memorizar dónde está cada botón de GitHub.
