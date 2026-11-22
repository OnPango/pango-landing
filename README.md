<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logos/pango-marca-marron.svg" />
    <img src="public/logos/pango-marca-tinta.svg" alt="Logo de Pango" width="64" />
  </picture>
</div>

# Pango — Landing Page

> *Registra. Anticipa. Pide a tiempo.*

Sitio web de presentación de **Pango**, una plataforma web multiempresa para la gestión inteligente de inventarios y pronóstico de demanda orientada a pequeñas y medianas empresas (pymes).

---

## Acerca de Pango

Muchas pymes controlan sus existencias en hojas de cálculo, cuadernos o sistemas contables que registran ventas pero no anticipan qué viene. Esto genera **quiebres de stock** (ventas perdidas), **compras de más** por intuición e **información dispersa** entre almacenes.

**Pango** convierte el registro diario en decisiones de reposición oportunas:

- **Historial inmutable de movimientos**: cada entrada, salida, ajuste o transferencia queda registrada sin borrados.
- **Pronóstico de demanda**: estima cuánto se consumirá de cada producto en las próximas semanas a partir del historial real.
- **Alertas de punto de reorden**: notifica de forma preventiva y crítica cuándo conviene reponer antes de quedarse sin existencias.

### Arquitectura de la plataforma

Este repositorio corresponde al sitio público de presentación. La solución completa de Pango se compone de:

- **Landing page (`pango-landing`, este repositorio)**: sitio estático de presentación y acceso a la plataforma construido con Astro y Tailwind CSS.
- **Aplicación web**: interfaz multiempresa por subdominio (`mi-empresa.onpango.com`) construida con React, Vite y TanStack Query para inventario, movimientos, solicitudes internas, alertas, roles y permisos.
- **API (`pango-core`)**: backend en NestJS y Prisma sobre PostgreSQL con esquema aislado por organización.
- **Servicio de pronóstico**: microservicio en Python y FastAPI orientado a series semanales de demanda y cálculo de reposición.

---

## Características de la landing

- **Secciones implementadas**:
  - `Header`: navegación principal, selector de tema claro/oscuro y acceso a la aplicación.
  - `Hero`: propuesta de valor, accesos de registro/navegación y tarjetas flotantes animadas sobre el estado del inventario.
  - `Sectors`: marquesina continua con rubros de pymes compatibles (ferreterías, farmacias, bodegas, papelerías, alimentos, etc.).
  - `HowItWorks`: guía interactiva en 3 pasos con progreso automático y mockups de registro de movimiento, gráfica de pronóstico y alertas.
  - `Benefits`: grilla estilo *bento* con los beneficios clave (alertas de stock, roles por equipo, operación desde celular, aislamiento multiempresa e importación desde Excel/CSV).
  - `Faq`: preguntas frecuentes desplegables con `<details>`.
  - `Cta` y `Footer`: llamado a la acción final y pie de página con enlaces de navegación.
- **Tema claro y oscuro**: controlado mediante `[data-theme="dark"]` en `<html>`, resuelto antes del primer pintado en `src/layouts/Layout.astro` para evitar parpadeos y persistido en `localStorage` bajo la clave `pango-theme`, con variantes específicas del logo (`pango-marca-tinta.svg` y `pango-marca-marron.svg`).
- **Identidad visual**: paleta de marca definida en `src/styles/global.css` (**Tinta** `#1E2A22`, **Arena** `#F6F1E7`, **Cobre** `#B5502E`, **Musgo** `#3B6E58`) acompañada de las fuentes variables locales **Space Grotesk** y **Work Sans** (`@fontsource-variable`).
- **Animaciones accesibles** (`src/scripts/motion.ts`): revelación al hacer scroll (`[data-reveal]`), avance automático de pasos (`[data-how]`) y efecto de onda/lupa sobre tarjetas (`[data-zoom]`), todo desactivado automáticamente cuando el usuario tiene activo `prefers-reduced-motion: reduce`.

---

## Stack tecnológico

- **Framework**: [Astro](https://astro.build) `7.x` (salida estática)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com) `4.x` (`@tailwindcss/vite`)
- **Lenguaje**: TypeScript (`astro/tsconfigs/strict`)
- **Tipografías**: `@fontsource-variable/space-grotesk` y `@fontsource-variable/work-sans`
- **Entorno y gestor de paquetes**: Node.js `>= 22.12.0` y `pnpm`

---

## Estructura del proyecto

```text
/
├── public/
│   ├── img/
│   │   └── pango-hero.png
│   └── logos/
│       ├── pango-icono-app-marca-oscuro.svg
│       ├── pango-marca-marron.svg
│       └── pango-marca-tinta.svg
├── src/
│   ├── components/
│   │   ├── Benefits.astro
│   │   ├── Cta.astro
│   │   ├── Faq.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── HowItWorks.astro
│   │   └── Sectors.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── scripts/
│   │   └── motion.ts
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Requisitos e instalación local

### Prerrequisitos

- **Node.js**: `>= 22.12.0`
- **pnpm**: instalado globalmente o habilitado vía `corepack enable`

### Pasos

1. Instalar las dependencias del proyecto:

```sh
pnpm install
```

2. Configurar las variables de entorno en un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_APP_URL=http://localhost:5173
```

| Variable | Descripción |
| :--- | :--- |
| `PUBLIC_APP_URL` | URL base de la aplicación web de Pango. Se utiliza en `Header.astro`, `Hero.astro`, `Cta.astro` y `Footer.astro` para construir los enlaces de inicio de sesión y registro. |

3. Iniciar el servidor de desarrollo:

```sh
pnpm dev
```

El sitio quedará disponible en `http://localhost:4321`.

---

## Comandos disponibles

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `pnpm install` | Instala las dependencias del proyecto |
| `pnpm dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `pnpm build` | Compila el sitio estático de producción en `./dist/` |
| `pnpm preview` | Previsualiza localmente el resultado de `pnpm build` |
| `pnpm astro ...` | Ejecuta comandos de la CLI de Astro (por ejemplo `pnpm astro check`) |

---

## Autores y contexto académico

Proyecto de grado desarrollado en el programa de **Ingeniería de Sistemas y Computación** de la **Universidad del Norte** (Barranquilla, Colombia).

- **Equipo**: Carlos Arango, Esteban Dadul, Andrés Monserrat y Judith Pérez
- **Profesor a cargo**: Wilson Nieto Bernal
- **Tutor**: Daniel José Romero Martínez
