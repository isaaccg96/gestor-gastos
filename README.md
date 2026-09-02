# Gestor de Gastos Personales

Aplicación web para el seguimiento de gastos personales, organizados por categorías, con resúmenes visuales de gasto por categoría y por mes.

Proyecto construido como práctica de un stack moderno (Laravel + React + API REST), partiendo de experiencia previa en PHP puro y bases de datos Oracle.

## Stack tecnológico

- **Backend:** Laravel 13, PHP 8.5
- **Base de datos:** MySQL 8.4
- **Frontend:** React 19, Inertia.js (para autenticación) y API REST + `fetch` (para el core de la aplicación)
- **Gráficos:** Recharts
- **Autenticación:** Laravel Breeze + Laravel Sanctum (cookies de sesión para el frontend)
- **Entorno de desarrollo:** Docker + Laravel Sail
- **Estilos:** Tailwind CSS

## Funcionalidades

- Registro e inicio de sesión de usuarios
- CRUD completo de categorías de gasto
- CRUD completo de gastos, con monto, descripción, fecha y categoría asociada
- Resumen visual de gasto total por categoría (gráfico de barras)
- Resumen visual de gasto total por mes (gráfico de líneas)
- Cada usuario solo puede ver y gestionar sus propios datos

## Arquitectura

El proyecto combina dos enfoques de comunicación entre backend y frontend, de forma intencional, como ejercicio de aprendizaje:

- **Inertia.js** para las páginas de autenticación (login, registro), donde Laravel entrega directamente los componentes de React con sus datos.
- **API REST propia** (`/api/categories`, `/api/expenses`, `/api/summary/*`) para el núcleo de la aplicación, consumida desde React mediante `fetch`, con autenticación por cookies de sesión vía Laravel Sanctum.

## Cómo ejecutar el proyecto

Requiere tener [Docker](https://www.docker.com/) instalado. No hace falta instalar PHP, MySQL ni Node en tu máquina.

```bash
git clone git@github.com:isaaccg96/gestor-gastos.git
cd gestor-gastos
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail composer install
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
```

La aplicación estará disponible en `http://localhost`.

## Estructura del proyecto

```
app/Http/Controllers/    Controladores de la API (Category, Expense, Summary)
app/Models/               Modelos Eloquent y sus relaciones
database/migrations/      Definición de las tablas
resources/js/Pages/       Componentes React (Expenses.jsx es el núcleo de la app)
routes/api.php            Rutas de la API REST
routes/web.php            Rutas web (Inertia)
docs/                      Notas técnicas del proceso de construcción
```

## Notas

Este proyecto documenta también el proceso de aprendizaje: en la carpeta [`docs/`](./docs) hay una guía detallada de cómo se construyó, incluyendo los problemas de entorno que se resolvieron por el camino (Docker, conflictos de puertos, configuración de Sanctum, etc.).
