# Guía completa: de Ubuntu limpio a un CRUD Laravel + React funcionando

Esta guía documenta, paso a paso y en orden real, todo lo que se hizo para montar el entorno de desarrollo y construir un gestor de gastos personales con Laravel (backend) y React (frontend), partiendo de un sistema Ubuntu recién instalado.

---

## Índice

1. [Instalación del entorno base](#1-instalación-del-entorno-base)
2. [Instalación de Docker](#2-instalación-de-docker)
3. [Instalación de VS Code](#3-instalación-de-vs-code)
4. [Creación del proyecto Laravel con Sail](#4-creación-del-proyecto-laravel-con-sail)
5. [Problemas de arranque y cómo se resolvieron](#5-problemas-de-arranque-y-cómo-se-resolvieron)
6. [Primer arranque correcto de la aplicación](#6-primer-arranque-correcto-de-la-aplicación)
7. [Instalación de autenticación con Breeze (React + Inertia)](#7-instalación-de-autenticación-con-breeze-react--inertia)
8. [Problemas durante la instalación de Breeze](#8-problemas-durante-la-instalación-de-breeze)
9. [Modelo de datos: Categorías y Gastos](#9-modelo-de-datos-categorías-y-gastos)
10. [Relaciones entre modelos (Eloquent)](#10-relaciones-entre-modelos-eloquent)
11. [Pruebas del modelo con Tinker](#11-pruebas-del-modelo-con-tinker)
12. [Construcción de la API REST](#12-construcción-de-la-api-rest)
13. [Autenticación de la API con Sanctum](#13-autenticación-de-la-api-con-sanctum)
14. [Pruebas de la API con curl](#14-pruebas-de-la-api-con-curl)
15. [Construcción del frontend en React](#15-construcción-del-frontend-en-react)
16. [El problema del error 401 y su solución](#16-el-problema-del-error-401-y-su-solución)
17. [CRUD completo: crear, leer, editar y eliminar](#17-crud-completo-crear-leer-editar-y-eliminar)
18. [Glosario de conceptos clave](#18-glosario-de-conceptos-clave)
19. [Resumen con agregaciones y gráficos (Recharts)](#19-resumen-con-agregaciones-y-gráficos-recharts)
20. [Subida del proyecto a GitHub](#20-subida-del-proyecto-a-github)
21. [Policies: seguridad entre usuarios](#21-policies-seguridad-entre-usuarios)
22. [Glosario ampliado (segunda sesión)](#22-glosario-ampliado-segunda-sesión)
23. [Límite de presupuesto por categoría y barra de progreso](#23-límite-de-presupuesto-por-categoría-y-barra-de-progreso)
24. [Enlace de navegación a Gastos](#24-enlace-de-navegación-a-gastos)
25. [Suite de tests automatizados con Pest](#25-suite-de-tests-automatizados-con-pest)
26. [Glosario ampliado (tercera sesión)](#26-glosario-ampliado-tercera-sesión)
27. [Qué queda pendiente](#27-qué-queda-pendiente)

---

## 1. Instalación del entorno base

Punto de partida: Ubuntu recién instalado, sin herramientas de desarrollo.

### PHP y extensiones

```bash
sudo apt update
sudo apt install php php-cli php-mbstring php-xml php-curl php-zip unzip
```

Esto instala el intérprete de PHP en modo línea de comandos (`php-cli`) y las extensiones necesarias para que Composer y Laravel funcionen correctamente (manejo de texto multibyte, XML, peticiones HTTP, archivos comprimidos).

### Composer

Composer es el gestor de dependencias de PHP (el equivalente a `npm` en el mundo JavaScript). Permite instalar librerías de terceros (como Laravel) sin tener que descargarlas a mano.

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

El primer comando descarga el instalador y lo ejecuta con PHP. El segundo mueve el archivo resultante (`composer.phar`) a una carpeta del sistema (`/usr/local/bin`) y lo renombra a `composer`, para poder ejecutarlo desde cualquier carpeta simplemente escribiendo `composer`.

### Base de datos

```bash
sudo apt install mysql-server
```

**Nota importante:** este MySQL instalado directamente en el sistema (nativo) causó más adelante un conflicto de puertos con el MySQL que corre dentro de Docker (ver sección 5). Se terminó desactivando con:

```bash
sudo systemctl stop mysql
sudo systemctl disable mysql
```

### Node.js (a través de nvm)

Se instaló Node con `nvm` (Node Version Manager) en vez de con el gestor de paquetes de Ubuntu, para poder controlar fácilmente qué versión de Node se usa:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

**Problema encontrado:** al ejecutar `nvm install --lts` justo después, dio el error `orden no encontrada` (comando no encontrado).

**Causa:** el instalador de nvm añade unas líneas al archivo `~/.bashrc`, pero ese archivo solo se lee automáticamente cuando se **abre una terminal nueva**. La terminal que ya estaba abierta no se enteró del cambio.

**Solución:**

```bash
source ~/.bashrc
```

El comando `source` le dice a la terminal "vuelve a leer este archivo ahora mismo, en esta misma sesión". A partir de ese momento, cualquier terminal nueva carga `nvm` automáticamente sin necesidad de repetir este paso.

Una vez disponible el comando `nvm`, se instaló la versión LTS (long-term support, la versión estable recomendada) de Node:

```bash
nvm install --lts
```

### Git

```bash
sudo apt install git
```

---

## 2. Instalación de Docker

Docker permite empaquetar una aplicación junto con todo lo que necesita para funcionar (sistema operativo mínimo, librerías, versión exacta de cada programa) dentro de una unidad aislada llamada **contenedor**. La ventaja principal es la reproducibilidad: el entorno funciona igual en cualquier máquina donde se ejecute, sin depender de lo que ya esté instalado en el sistema anfitrión.

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

El primer comando descarga el script oficial de instalación de Docker. El segundo lo ejecuta con permisos de administrador. El tercero añade al usuario actual al grupo `docker`, para poder ejecutar comandos de Docker sin necesitar `sudo` cada vez.

**Importante:** después de `usermod`, hace falta cerrar sesión y volver a entrar (o reiniciar) para que el cambio de grupo se aplique — el mismo tipo de problema que con `.bashrc`: el cambio existe, pero la sesión actual no lo sabe todavía.

### Verificación de la instalación

```bash
docker --version
sudo systemctl status docker
docker run hello-world
```

- `docker --version` confirma que el comando existe y qué versión es.
- `systemctl status docker` confirma que el servicio de Docker está activo (`active (running)`).
- `docker run hello-world` es la prueba definitiva: descarga una imagen mínima de prueba y ejecuta un contenedor con ella. Si aparece el mensaje `Hello from Docker!`, todo funciona correctamente, incluido el permiso para ejecutar contenedores sin `sudo`.

Resultado en este caso: **todo funcionó correctamente** desde el primer intento.

---

## 3. Instalación de VS Code

Se instaló mediante Snap (el gestor de paquetes universal que trae Ubuntu preinstalado):

```bash
sudo snap install code --classic
```

El flag `--classic` es necesario porque VS Code necesita acceso completo al sistema de archivos (para poder abrir y editar archivos en cualquier ubicación, y ejecutar terminales integradas).

Para abrirlo desde la terminal, estando dentro de la carpeta de un proyecto:

```bash
code .
```

### Extensiones instaladas

- **PHP Intelephense** — autocompletado y análisis de código PHP
- **Laravel Extension Pack** — herramientas específicas de Laravel
- **ES7+ React/Redux/React-Native snippets** — atajos de código para React
- **GitLens** — mejoras visuales para trabajar con Git

---

## 4. Creación del proyecto Laravel con Sail

### Qué es Sail

Sail es una herramienta oficial de Laravel que usa Docker por debajo, pero evita tener que escribir a mano toda la configuración de Docker. Define, en un archivo llamado `compose.yaml`, todos los contenedores que la aplicación necesita (el propio Laravel, la base de datos, sistemas de caché, etc.) y los levanta todos juntos con un solo comando.

**Por qué se eligió Sail en vez de instalar PHP/MySQL directamente en la máquina:** porque hace el proyecto mucho más fácil de "exportar". Cualquiera que clone el repositorio solo necesita tener Docker instalado — no necesita instalar PHP, la versión correcta de extensiones, ni configurar MySQL a mano. Solo ejecuta `./vendor/bin/sail up` y el entorno completo se levanta idéntico al original.

### Creación del proyecto

```bash
curl -s "https://laravel.build/proyecto001" | bash
```

Este comando descarga una instalación limpia de Laravel dentro de una carpeta llamada `proyecto001`, usando un contenedor Docker temporal para ese proceso (no hace falta tener PHP instalado en el sistema para este paso en concreto). Pidió la contraseña de `sudo` en algún momento, para ajustar permisos de archivos.

### Primer intento de arranque

```bash
cd proyecto001
./vendor/bin/sail up -d
```

El flag `-d` significa "detached" (desacoplado): hace que los contenedores corran en segundo plano, dejando la terminal libre para seguir usándola.

---

## 5. Problemas de arranque y cómo se resolvieron

### Problema 1: sin espacio en disco

**Error:**
```
no space left on device
```

**Diagnóstico:**
```bash
df -h
```
Mostró que el disco tenía solo 24 GB en total, con apenas 595 MB libres (uso al 98%).

**Causa:** las imágenes de Docker (Laravel, MySQL, Redis, etc.) ocupan varios gigabytes en conjunto, y el disco de la máquina virtual era demasiado pequeño para ese conjunto completo.

**Solución inmediata — liberar espacio de Docker:**
```bash
docker system prune -a --volumes
```
Este comando elimina imágenes, contenedores y volúmenes de Docker que no estén en uso activo. Se liberaron **8.82 GB**.

**Solución definitiva — ampliar el disco de la VM:**
Se amplió el disco virtual desde el hipervisor (Oracle VirtualBox), y después se extendió la partición dentro de Ubuntu con:
```bash
sudo apt install cloud-guest-utils gdisk
sudo growpart /dev/sda 2
sudo resize2fs /dev/sda2
```
- `cloud-guest-utils` aporta el comando `growpart`, que expande una partición existente para que ocupe el espacio nuevo disponible en el disco.
- `gdisk` es una herramienta de gestión de tablas de particiones (soporta tanto GPT como MBR) que `growpart` usa internamente para leer y modificar la tabla de particiones de forma seguro mientras el disco está en uso.
- `growpart /dev/sda 2` le dice a la tabla de particiones que la partición número 2 del disco `/dev/sda` puede ocupar hasta el final del disco.
- `resize2fs /dev/sda2` hace que el sistema de archivos ext4 que vive dentro de esa partición use efectivamente el espacio nuevo.

Instalar los paquetes (`apt install`) **no modifica el disco por sí solo** — solo prepara las herramientas. El cambio real ocurre al ejecutar `growpart` y `resize2fs`.

### Problema 2: conflicto en el puerto 3306 (MySQL)

**Error:**
```
failed to bind host port 0.0.0.0:3306/tcp: address already in use
```

**Causa:** el MySQL instalado de forma nativa en el sistema (paso 1 de esta guía) seguía corriendo y ocupando el puerto 3306, el mismo puerto que el contenedor de MySQL de Sail intentaba usar.

**Diagnóstico:**
```bash
sudo lsof -i :3306
sudo ss -tulpn | grep 3306
```

**Solución elegida — detener el MySQL nativo** (ya que el proyecto usa el MySQL de Sail/Docker):
```bash
sudo systemctl stop mysql
sudo systemctl disable mysql
```
`stop` lo detiene en el momento; `disable` evita que vuelva a arrancar automáticamente al reiniciar el sistema.

### Problema 3: conflicto en el puerto 80 (Apache)

**Error:**
```
failed to bind host port 0.0.0.0:80/tcp: address already in use
```

**Causa:** Apache, instalado como parte del entorno de trabajo original (mencionado en la conversación como parte del stack habitual de trabajo), estaba corriendo y ocupando el puerto 80 — el mismo que el contenedor `laravel.test` necesita para servir la aplicación por HTTP.

**Diagnóstico:**
```bash
sudo ss -tulpn | grep :80
```
Confirmó que el proceso `apache2` tenía el puerto ocupado.

**Solución:**
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Problema 4: contenedor "atascado" tras fallos anteriores

Después de resolver los puertos, `sail ps` mostraba el contenedor `laravel.test` como `Up`, pero **sin ningún puerto mapeado** en la columna `PORTS` — es decir, decía estar corriendo pero no era accesible desde el navegador.

**Causa:** el contenedor se había creado en un intento anterior, cuando el puerto 80 todavía estaba ocupado por Apache. Aunque luego se reinició, Docker no reintentó el mapeo de puertos sobre un contenedor ya existente con esa configuración fallida.

**Solución — recrear los contenedores desde cero:**
```bash
./vendor/bin/sail down
./vendor/bin/sail up -d
```
`down` detiene y **elimina** los contenedores (no borra los datos de MySQL, que viven en un volumen aparte). Al volver a crearlos con `up -d`, Docker intentó de nuevo el mapeo de puertos, esta vez con éxito porque los puertos ya estaban libres.

Confirmación con:
```bash
./vendor/bin/sail ps
```
Esta vez sí mostró `0.0.0.0:80->80/tcp` en la columna `PORTS`.

---

## 6. Primer arranque correcto de la aplicación

Al visitar `http://localhost`, apareció un error:

```
Illuminate\Database\QueryException
SQLSTATE[42S02]: Base table or view not found: 1146 Table 'laravel.sessions' doesn't exist
```

**Explicación:** este error en realidad confirmaba que Laravel **ya se conectaba correctamente** a MySQL (si no, el error habría sido de conexión, no de "tabla no encontrada"). Lo que faltaba era ejecutar las **migraciones**: los archivos que definen la estructura de las tablas todavía no se habían aplicado a la base de datos, así que las tablas base de Laravel (incluida `sessions`, que gestiona las sesiones de usuario) no existían.

**Solución:**
```bash
./vendor/bin/sail artisan migrate
```

Tras esto, `http://localhost` cargó correctamente, mostrando la página de bienvenida de Laravel.

---

## 7. Instalación de autenticación con Breeze (React + Inertia)

**Laravel Breeze** es un paquete oficial de Laravel que instala, de forma preconfigurada, todo el sistema de autenticación (registro, login, recuperación de contraseña, verificación de email) junto con las páginas correspondientes ya construidas.

```bash
./vendor/bin/sail composer require laravel/breeze --dev
./vendor/bin/sail artisan breeze:install
```

Durante la instalación, se preguntó qué stack de frontend usar. Se eligió **React with Inertia**.

### Qué es Inertia

Inertia es una capa que conecta Laravel con React sin necesitar montar una API REST separada para esa parte de la aplicación. Los controladores de Laravel devuelven directamente componentes de React (con `Inertia::render(...)` en vez de `view(...)`), y Laravel se encarga de las rutas y la validación de forma habitual, mientras Inertia entrega los datos como props al componente de React correspondiente.

**Decisión tomada en el proyecto:** usar Inertia solo para el módulo de autenticación (ya que Breeze lo entrega hecho), y construir el resto del proyecto (categorías y gastos) como una **API REST propia**, consumida desde React mediante `fetch`. El objetivo fue practicar ambos enfoques dentro del mismo proyecto.

### Testing: Pest vs. PHPUnit

Durante la instalación también se preguntó qué framework de testing usar. Se eligió **Pest**, por ser el recomendado por defecto en Laravel actualmente y tener una sintaxis más legible que PHPUnit (aunque, por debajo, ambos comparten el mismo motor).

---

## 8. Problemas durante la instalación de Breeze

### Problema 1: conflicto de dependencias de npm

**Error:**
```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
...
peer vite@"^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0" from @vitejs/plugin-react@4.7.0
```

**Causa:** el paquete `@vitejs/plugin-react` esperaba una versión de `vite` entre la 4 y la 7, pero el proyecto tenía instalada la versión 8, demasiado nueva para ese plugin en ese momento. Es un conflicto típico entre versiones de paquetes del ecosistema JavaScript, no un error de configuración por parte del usuario.

**Solución:**
```bash
./vendor/bin/sail npm install --legacy-peer-deps
```
El flag `--legacy-peer-deps` le indica a npm que instale igualmente, sin ser estricto verificando que todas las dependencias entre paquetes coincidan exactamente — una práctica común y segura para conflictos menores de este tipo.

Este mismo conflicto volvió a aparecer una segunda vez, al reinstalar Breeze (ver siguiente problema), porque el propio comando `breeze:install` ejecuta internamente su propio `npm install` sin la bandera `--legacy-peer-deps`.

### Problema 2: archivo `bootstrap.js` faltante

Tras el primer intento de `npm run build`, apareció:

```
[UNRESOLVED_IMPORT] Could not resolve './bootstrap' in resources/js/app.jsx
```

**Diagnóstico:**
```bash
ls -la resources/js/
```
Mostró que existían las carpetas `Components`, `Layouts`, `Pages` y el archivo `app.jsx`, pero **no** `bootstrap.js`.

```bash
cat resources/js/app.jsx
```
Confirmó que `app.jsx` intentaba importar `./bootstrap` en su segunda línea.

```bash
find . -name "bootstrap.js*" -not -path "*/node_modules/*"
```
Confirmó que el archivo no existía en ningún lugar del proyecto.

**Causa:** el proceso interno de `breeze:install` se interrumpió antes de copiar ese archivo específico, probablemente porque el `npm install` interno falló antes de completar todos los pasos del script de instalación.

**Se intentó primero reinstalar Breeze** (`./vendor/bin/sail artisan breeze:install react`), pero el archivo seguía sin generarse — el mismo conflicto de npm volvía a cortar el proceso en el mismo punto.

**Solución final — crear el archivo manualmente:**
```bash
cat > resources/js/bootstrap.js << 'EOF'
import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
EOF
```

Este es el contenido estándar que trae cualquier proyecto Laravel nuevo con Breeze: importa **Axios** (una librería para hacer peticiones HTTP), lo expone globalmente como `window.axios`, y añade una cabecera (`X-Requested-With: XMLHttpRequest`) que Laravel usa para reconocer que una petición viene de JavaScript.

Se verificó que `axios` estuviera entre las dependencias del proyecto:
```bash
cat package.json | grep axios
./vendor/bin/sail npm install axios --legacy-peer-deps
```

Tras esto, el build se completó correctamente:
```bash
./vendor/bin/sail npm run build
```
Resultado: `✓ built in 1.06s`, generando todos los archivos JavaScript compilados dentro de `public/build/`.

### Migraciones nuevas de Breeze

Breeze añade tablas relacionadas con verificación de email y tokens. Se aplicaron con:
```bash
./vendor/bin/sail artisan migrate
```

### Confirmación final

Se accedió a `http://localhost`, se navegó a `/register`, se creó una cuenta, y se confirmó acceso al `/dashboard` con el mensaje **"You're logged in!"** — confirmando que todo el flujo (React → Inertia → Laravel → MySQL) funcionaba de punta a punta.

---

## 9. Modelo de datos: Categorías y Gastos

Antes de programar, se comprobó el estado de las migraciones:
```bash
./vendor/bin/sail artisan migrate
```
Resultado: `Nothing to migrate` (ya estaban todas aplicadas hasta ese punto).

### Creación de modelos y migraciones

```bash
./vendor/bin/sail artisan make:model Category -m
./vendor/bin/sail artisan make:model Expense -m
```

El flag `-m` (de "migration") le dice a Laravel que, además del modelo, genere también el archivo de migración correspondiente en la misma orden.

### Estructura definida

**Tabla `categories`:**
```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->timestamps();
});
```

**Tabla `expenses`:**
```php
Schema::create('expenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->decimal('amount', 10, 2);
    $table->string('description')->nullable();
    $table->date('date');
    $table->timestamps();
});
```

**Explicación de cada pieza:**
- `$table->id()` — crea una columna `id` autoincremental, clave primaria.
- `$table->foreignId('user_id')->constrained()` — crea una columna `user_id` y la vincula automáticamente como clave foránea a la tabla `users` (Laravel deduce el nombre de la tabla relacionada a partir del nombre de la columna).
- `->cascadeOnDelete()` — si se borra el usuario (o la categoría, en el caso de `expenses`) al que pertenece un registro, ese registro se borra también automáticamente, evitando datos "huérfanos" sin dueño.
- `$table->decimal('amount', 10, 2)` — un número decimal con hasta 10 dígitos en total y 2 después de la coma, apropiado para cantidades de dinero. **Nunca se usa `float` para dinero**, porque los números de coma flotante pueden introducir pequeños errores de redondeo.
- `$table->string('description')->nullable()` — texto opcional (`nullable` permite que el campo quede vacío).
- `$table->date('date')` — una fecha (sin hora).
- `$table->timestamps()` — crea automáticamente las columnas `created_at` y `updated_at`, que Laravel actualiza solo.

Tras editar ambos archivos en VS Code, se aplicaron con:
```bash
./vendor/bin/sail artisan migrate
```

---

## 10. Relaciones entre modelos (Eloquent)

**Eloquent** es el ORM (Object-Relational Mapper) de Laravel: permite tratar los registros de la base de datos como objetos PHP normales, sin escribir SQL a mano para las operaciones habituales.

### `app/Models/User.php`

```php
public function categories()
{
    return $this->hasMany(Category::class);
}

public function expenses()
{
    return $this->hasMany(Expense::class);
}
```

`hasMany` indica que un usuario puede tener muchas categorías y muchos gastos.

### `app/Models/Category.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
```

### `app/Models/Expense.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['amount', 'description', 'date', 'category_id', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
```

`belongsTo` es la relación inversa de `hasMany`: indica que una categoría pertenece a un usuario, y que un gasto pertenece tanto a un usuario como a una categoría.

### Qué es `$fillable`

Es una medida de seguridad de Laravel. Por defecto, Eloquent **bloquea** la asignación masiva de datos (crear o actualizar un registro pasando un array completo de golpe, como `Category::create($datosDelFormulario)`), para evitar que alguien envíe un campo malicioso (por ejemplo, un `user_id` que no le corresponde) camuflado en un formulario. `$fillable` es la lista explícita de qué campos sí se permite asignar de esa forma.

**Nota sobre el archivo `User.php`:** no hizo falta añadir un `use App\Models\Category;` ni `use App\Models\Expense;` al principio del archivo, porque `User`, `Category` y `Expense` viven en el mismo namespace (`App\Models`), y PHP resuelve automáticamente las clases del mismo namespace sin necesitar una importación explícita.

---

## 11. Pruebas del modelo con Tinker

**Tinker** es una consola interactiva que trae Laravel, donde se puede ejecutar código PHP/Laravel en vivo, línea por línea, sin necesidad de crear rutas ni vistas. Es la forma más rápida de probar que los modelos y relaciones funcionan.

```bash
./vendor/bin/sail artisan tinker
```

### Secuencia de pruebas realizadas

```php
$user = App\Models\User::first();
$user->email
```
Confirmó que se podía acceder al usuario ya registrado.

```php
$category = $user->categories()->create(['name' => 'Comida']);
```
Creó una categoría vinculada automáticamente a ese usuario, usando la relación `categories()` definida en el modelo `User`.

```php
$expense = $user->expenses()->create([
    'category_id' => $category->id,
    'amount' => 25.50,
    'description' => 'Supermercado',
    'date' => now(),
]);
```
Creó un gasto vinculado a esa categoría y a ese usuario.

```php
$expense->category->name
```
Devolvió `"Comida"`, confirmando que la relación inversa (`belongsTo`) funcionaba correctamente: desde un gasto se podía "navegar" de vuelta a su categoría.

**Nota sobre persistencia:** tras reiniciar el ordenador, se comprobó que estos datos de prueba seguían intactos, porque MySQL guarda sus datos en un **volumen de Docker**, que persiste aunque los contenedores se detengan (los volúmenes solo se borran si se ejecuta `docker system prune` con la opción `--volumes`, o si se hace `sail down -v`).

---

## 12. Construcción de la API REST

### Controladores

```bash
./vendor/bin/sail artisan make:controller CategoryController --api --model=Category
./vendor/bin/sail artisan make:controller ExpenseController --api --model=Expense
```

El flag `--api` genera únicamente los métodos relevantes para una API (sin `create` ni `edit`, que en Laravel tradicionalmente sirven formularios HTML). El flag `--model=Category` (o `Expense`) hace que Laravel prepare los métodos usando **Route Model Binding** (ver más abajo).

### `app/Http/Controllers/CategoryController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->categories()->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        return $request->user()->categories()->create($validated);
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update($validated);

        return $category;
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->noContent();
    }
}
```

### `app/Http/Controllers/ExpenseController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->expenses()->with('category')->latest('date')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        return $request->user()->expenses()->create($validated);
    }

    public function show(Expense $expense)
    {
        return $expense->load('category');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        $expense->update($validated);

        return $expense->load('category');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->noContent();
    }
}
```

### Conceptos clave usados en los controladores

**`$request->user()`** — devuelve el usuario autenticado en la petición actual. Usarlo para filtrar (`$request->user()->categories()`) asegura que cada usuario solo pueda ver y crear sus propios datos.

**Route Model Binding** (`Category $category` en vez de recibir un `$id`) — Laravel coge automáticamente el identificador que viene en la URL, busca el modelo correspondiente en la base de datos, y si no existe, responde con un 404 sin que haga falta escribir ese código manualmente.

**`$request->validate([...])`** — valida los datos entrantes antes de usarlos. Si algo no cumple las reglas, Laravel responde automáticamente con un error 422 detallando qué campo falló, sin necesidad de programar ese manejo de errores a mano.

**`exists:categories,id`** — una regla de validación que comprueba que el `category_id` recibido corresponda realmente a una categoría existente en la base de datos, evitando así crear gastos que apunten a una categoría inexistente.

**`with('category')` y `load('category')`** — esto es **eager loading** (carga anticipada). Sin esto, cada vez que se accede a `expense.category` desde fuera, Laravel haría una consulta SQL adicional por cada gasto individual (el problema conocido como "N+1 queries"). Con `with()`/`load()`, Laravel trae los gastos y sus categorías relacionadas en un número mínimo de consultas, sin importar cuántos gastos haya.

**Nota de seguridad pendiente:** los métodos `show`, `update` y `destroy` de ambos controladores, tal como están escritos aquí, no verifican todavía que el registro pertenezca al usuario autenticado — solo verifican que exista. Esto significa que, en teoría, un usuario autenticado podría editar o borrar un registro de otro usuario si adivinara su ID. La solución correcta para esto (pendiente de implementar) son las **Policies** de Laravel, mencionadas en la sección de pendientes.

### Rutas

Se comprobó que `routes/api.php` no existía todavía (en versiones recientes de Laravel, las rutas de API no vienen activadas por defecto). Se generó con:

```bash
./vendor/bin/sail artisan install:api
```

Este comando crea `routes/api.php` y, además, instala y configura **Laravel Sanctum** (el sistema de autenticación para APIs, explicado en la siguiente sección).

Contenido final de `routes/api.php`:

```php
<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExpenseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('expenses', ExpenseController::class);
});
```

**`Route::apiResource('categories', CategoryController::class)`** — es un atajo que genera automáticamente las 5 rutas REST estándar apuntando a los métodos correspondientes del controlador:

| Verbo HTTP | URL | Método |
|---|---|---|
| GET | `/api/categories` | `index` |
| POST | `/api/categories` | `store` |
| GET | `/api/categories/{id}` | `show` |
| PUT/PATCH | `/api/categories/{id}` | `update` |
| DELETE | `/api/categories/{id}` | `destroy` |

Lo mismo aplica para `expenses`.

**`Route::middleware('auth:sanctum')->group(...)`** — envuelve un conjunto de rutas para que solo usuarios autenticados (con sesión o token válido) puedan acceder a ellas. Si alguien intenta acceder sin autenticarse, Laravel responde automáticamente con un 401.

Verificación de que las rutas quedaron registradas:
```bash
./vendor/bin/sail artisan route:list --path=api
```
Mostró las 11 rutas esperadas: las 5 de `categories`, las 5 de `expenses`, y `/user`.

---

## 13. Autenticación de la API con Sanctum

**Laravel Sanctum** es el paquete oficial de Laravel para autenticar APIs. Soporta dos modos:

1. **Tokens** — útil para clientes externos (aplicaciones móviles, scripts, Postman/curl) que no comparten dominio ni cookies con el backend.
2. **Cookies de sesión (modo "stateful")** — pensado para cuando el frontend (una SPA, como esta app de React) vive en el **mismo dominio** que el backend. En este caso, se reutiliza la sesión de autenticación normal de Laravel, sin necesitar tokens.

### Configuración de dominios "stateful"

```bash
cat config/sanctum.php | grep -A 3 "stateful"
```
Confirmó que `localhost` ya estaba incluido por defecto en la lista de dominios que pueden autenticarse por cookie (`SANCTUM_STATEFUL_DOMAINS`), sin necesitar configuración adicional en `.env`.

### El middleware que faltaba

Aunque el dominio estaba correctamente configurado, las peticiones desde React seguían devolviendo error **401 (no autenticado)**. La causa se encontró revisando:

```bash
cat bootstrap/app.php | grep -A 15 "withMiddleware"
```

Faltaba activar el middleware `EnsureFrontendRequestsAreStateful` en el grupo `api`. Sin él, Sanctum no reconocía la cookie de sesión como una autenticación válida para las rutas de `/api/*`, aunque la cookie llegara correctamente en cada petición (esto se confirmó revisando la pestaña "Network" de las herramientas de desarrollador del navegador, donde sí aparecía la cookie `laravel-session`).

**Solución**, editando `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
        \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
    ]);

    $middleware->api(prepend: [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);
})
```

**Por qué `prepend` y no `append`:** este middleware necesita ejecutarse **antes** que el resto del stack de middleware de `api`, para que cuando llegue el turno de comprobar `auth:sanctum`, la sesión ya haya sido reconocida como válida.

Como este es un cambio de configuración de PHP (no de assets de frontend), fue necesario reiniciar el contenedor para que Laravel lo cargara:

```bash
./vendor/bin/sail restart laravel.test
```

---

## 14. Pruebas de la API con curl

Antes de conectar React, se probó la API directamente desde la terminal usando `curl`, generando un token de prueba manualmente (solo para estas pruebas por terminal; el frontend real usa cookies, no este token).

### Generación de un token de prueba

```bash
./vendor/bin/sail artisan tinker
```
```php
$user = App\Models\User::first();
$token = $user->createToken('test-token')->plainTextToken;
```

**Primer intento fallido:**
```
BadMethodCallException: Call to undefined method App\Models\User::createToken().
```

**Causa:** al modelo `User` le faltaba el trait `HasApiTokens`, que es lo que le da la capacidad de generar tokens de Sanctum.

**Solución**, editando `app/Models/User.php`:
```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
    // ...
}
```

Tras guardar el cambio, fue necesario **salir y volver a entrar a Tinker** (`exit`, luego `./vendor/bin/sail artisan tinker` de nuevo) para que recargara la definición actualizada del modelo. Con eso, el token se generó correctamente.

### Pruebas realizadas

**GET (listar categorías):**
```bash
curl http://localhost/api/categories \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Accept: application/json"
```
Respuesta: JSON con la categoría "Comida" creada anteriormente desde Tinker.

**POST (crear categoría):**
```bash
curl -X POST http://localhost/api/categories \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Suscripciones"}'
```
Respuesta: JSON de la categoría recién creada, con su `id` asignado (`2`) y timestamps.

Ambas pruebas confirmaron que la API, la autenticación con Sanctum y la validación funcionaban correctamente antes de pasar al frontend.

---

## 15. Construcción del frontend en React

### Ruta web para servir la página

Como la página de gastos se sirve vía Inertia (no como parte de la API JSON), se añadió una ruta nueva en `routes/web.php`, siguiendo el mismo patrón que la ruta ya existente de `/dashboard`:

```php
Route::get('/expenses', function () {
    return Inertia::render('Expenses');
})->middleware(['auth', 'verified'])->name('expenses');
```

`Inertia::render('Expenses')` le dice a Laravel que sirva el componente React ubicado en `resources/js/Pages/Expenses.jsx`. El middleware `['auth', 'verified']` asegura que solo usuarios autenticados y con email verificado puedan acceder — igual que en `/dashboard`.

### Primer error encontrado: manifest de Vite

Al crear `resources/js/Pages/Expenses.jsx` por primera vez y visitar `/expenses`, apareció:
```
Unable to locate file in Vite manifest: resources/js/Pages/Expenses.jsx.
```

**Causa:** el archivo `manifest.json` que genera Vite (la herramienta que compila los archivos JavaScript/CSS) se había construido **antes** de crear `Expenses.jsx`, así que ese archivo nuevo no estaba incluido en el "índice" de archivos compilados.

**Solución inmediata:**
```bash
./vendor/bin/sail npm run build
```

**Solución para el resto del desarrollo** — usar el servidor de desarrollo con recarga en caliente, que detecta los cambios automáticamente sin necesitar recompilar a mano cada vez:
```bash
./vendor/bin/sail npm run dev
```
Este proceso se dejó corriendo en una terminal aparte durante el resto de la sesión.

### Estructura del componente `Expenses.jsx`

El componente final combina:

- **`useState`** — variables de estado de React. Cuando cambian, React vuelve a dibujar automáticamente la parte de la pantalla que depende de ellas. Se usó para guardar la lista de categorías, la lista de gastos, si algo está cargando, si hay un error, y los valores de los formularios.
- **`useEffect(() => {...}, [])`** — ejecuta código una sola vez, cuando el componente aparece en pantalla por primera vez (el array vacío `[]` indica "sin dependencias, solo una vez"). Aquí es donde se dispara la carga inicial de datos.
- **`fetch(...)`** — la función nativa del navegador para hacer peticiones HTTP. Se usó para llamar a los endpoints `/api/categories` y `/api/expenses`.
- **`Promise.all([...])`** — permite lanzar varias peticiones (categorías y gastos) en paralelo y esperar a que ambas terminen antes de continuar, en vez de esperarlas una detrás de otra.

---

## 16. El problema del error 401 y su solución

Al hacer el primer `fetch` desde React a `/api/categories`, la petición devolvía **401 (no autorizado)**, aunque el usuario ya estaba logueado.

### Primer intento de solución (parcial)

Se añadió `credentials: 'include'` al `fetch`:
```jsx
fetch('/api/categories', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
})
```
Esto le dice al navegador que **sí envíe las cookies** del dominio junto con la petición (por defecto, `fetch` no las incluye automáticamente). Necesario, pero no fue suficiente por sí solo.

### Diagnóstico

Revisando la pestaña **Network** de las herramientas de desarrollador del navegador, se confirmó que la cookie `laravel-session` **sí llegaba** en la petición. Esto descartó el problema de `credentials`.

Se revisó entonces la configuración del middleware, encontrando la causa real (ya explicada en la sección 13): faltaba `EnsureFrontendRequestsAreStateful` en el grupo `api` dentro de `bootstrap/app.php`.

Tras añadir ese middleware y reiniciar el contenedor de Laravel, la petición devolvió 200 y la lista de categorías se cargó correctamente en pantalla.

---

## 17. CRUD completo: crear, leer, editar y eliminar

### El token CSRF

Para cualquier petición que **modifique** datos (POST, PUT, DELETE), Laravel exige, además de la cookie de sesión, un **token CSRF** (Cross-Site Request Forgery) como protección contra ataques donde una web maliciosa intenta aprovechar que el navegador ya tiene una sesión activa para hacer peticiones no autorizadas en nombre del usuario.

Laravel entrega este token automáticamente en una cookie llamada `XSRF-TOKEN`. Se leyó desde JavaScript y se envió en la cabecera `X-XSRF-TOKEN` de cada petición que modificaba datos:

```jsx
const getCsrfToken = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};
```

### Crear (POST)

```jsx
fetch('/api/categories', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-XSRF-TOKEN': getCsrfToken(),
    },
    body: JSON.stringify({ name: newCategoryName }),
})
```

Tras crear con éxito, se volvía a pedir la lista completa (`loadAll()` / `fetchCategories()`), para que la interfaz reflejara el dato nuevo sin necesitar recargar la página manualmente.

### Eliminar (DELETE)

```jsx
fetch(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': getCsrfToken(),
    },
})
```

Antes de ejecutar el borrado, se usó `confirm(...)` (una función nativa del navegador que muestra un cuadro de diálogo de confirmación) como protección mínima contra clics accidentales:

```jsx
if (!confirm('¿Seguro que quieres eliminar esta categoría?')) {
    return;
}
```

### Editar (PUT) — con renderizado condicional

Para editar, se guardó en el estado **qué** registro se estaba editando (su ID), y cada elemento de la lista decidía, en el momento de dibujarse, si mostrarse en modo "vista" o en modo "edición":

```jsx
{editingCategoryId === category.id ? (
    // formulario de edición
) : (
    // vista normal con botones "Editar" y "Eliminar"
)}
```

Solo la fila cuyo ID coincidía con el guardado en el estado entraba en modo edición; el resto se mostraba con normalidad. El envío del formulario de edición usaba `method: 'PUT'`, con la misma estructura de cabeceras (incluido el token CSRF) que el resto de peticiones que modifican datos.

**Detalle técnico importante:** el botón "Cancelar" dentro del formulario de edición se marcó explícitamente como `type="button"`. Sin esto, al estar dentro de un `<form>`, el navegador lo trataría por defecto como un botón de tipo `submit`, disparando el envío del formulario al hacer clic en "Cancelar" — justo lo contrario de lo que se buscaba.

---

## 18. Glosario de conceptos clave

**Docker** — herramienta que empaqueta una aplicación junto con todo lo necesario para ejecutarla, dentro de una unidad aislada y reproducible llamada contenedor.

**Contenedor** — una instancia en ejecución de una imagen de Docker; una "caja" aislada con su propio sistema mínimo, librerías y procesos.

**Sail** — herramienta oficial de Laravel que simplifica el uso de Docker para proyectos Laravel, mediante comandos cortos como `sail up`, `sail artisan`, `sail npm`.

**Composer** — gestor de dependencias de PHP; instala librerías de terceros declaradas en `composer.json`.

**npm** — gestor de dependencias de JavaScript; instala librerías declaradas en `package.json`.

**Migración** — un archivo PHP que describe la estructura de una tabla de base de datos (columnas, tipos, relaciones), de forma que el esquema quede versionado junto con el código.

**Eloquent** — el ORM (Object-Relational Mapper) de Laravel; permite tratar los registros de la base de datos como objetos PHP, sin escribir SQL a mano para las operaciones habituales.

**Modelo** — una clase PHP que representa una tabla de la base de datos dentro de Eloquent.

**Relación (`hasMany`, `belongsTo`)** — la definición, dentro de un modelo, de cómo se conecta con otro modelo/tabla, permitiendo navegar entre datos relacionados sin escribir JOINs manualmente.

**Route Model Binding** — mecanismo de Laravel que resuelve automáticamente un modelo a partir del identificador recibido en la URL de una ruta, devolviendo un 404 automáticamente si no existe.

**Middleware** — código que se ejecuta antes (o después) de que una petición llegue a su destino final (una ruta o controlador), usado típicamente para tareas como autenticación o validación de sesión.

**Sanctum** — el paquete oficial de Laravel para autenticar APIs, ya sea mediante tokens (para clientes externos) o mediante cookies de sesión en modo "stateful" (para SPAs que viven en el mismo dominio que el backend).

**Token CSRF** — un valor secreto que Laravel exige en peticiones que modifican datos, como protección contra ataques que intentan aprovechar una sesión activa del usuario desde un sitio malicioso.

**Inertia** — una capa que conecta Laravel con React (u otros frameworks de frontend) sin necesitar una API REST separada; los controladores devuelven directamente componentes de frontend con datos incluidos.

**API REST** — un estilo de diseño de API donde los recursos (categorías, gastos, etc.) se acceden mediante URLs y verbos HTTP estándar (GET, POST, PUT, DELETE), devolviendo datos en formato JSON, independientemente de qué cliente los consuma.

**`fetch`** — la función nativa del navegador para hacer peticiones HTTP desde JavaScript.

**`useState`** — un "hook" de React que declara una variable de estado; cuando su valor cambia, React vuelve a dibujar automáticamente la parte de la interfaz que depende de ella.

**`useEffect`** — un hook de React que ejecuta código en momentos concretos del ciclo de vida de un componente (por ejemplo, al montarse por primera vez en pantalla).

**Eager loading (`with()` / `load()`)** — técnica para traer datos relacionados (por ejemplo, la categoría de cada gasto) en un número mínimo de consultas SQL, evitando el problema de "N+1 queries".

**Validación de mass assignment (`$fillable`)** — mecanismo de seguridad de Eloquent que exige declarar explícitamente qué campos se pueden asignar en masa a un modelo, para evitar que datos no deseados se cuelen en la base de datos.

---

## 19. Resumen con agregaciones y gráficos (Recharts)

En una segunda sesión de trabajo se retomó el proyecto para añadir un resumen visual del gasto: total por categoría y total por mes, calculado directamente en la base de datos y mostrado con gráficos en React.

### Backend: controlador de resúmenes

```bash
./vendor/bin/sail artisan make:controller SummaryController
```

Contenido de `app/Http/Controllers/SummaryController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function byCategory(Request $request)
    {
        return $request->user()
            ->expenses()
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->with('category:id,name')
            ->get();
    }

    public function byMonth(Request $request)
    {
        return $request->user()
            ->expenses()
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }
}
```

**`selectRaw(...)`** — permite escribir una porción de SQL "en crudo" dentro de una consulta de Eloquent, necesario aquí porque se usa la función de agregación `SUM()`, que no tiene un atajo directo en la sintaxis normal de Eloquent.

**`groupBy('category_id')`** — agrupa todos los gastos que compartan la misma categoría, de forma que `SUM(amount)` calcule el total dentro de cada grupo (es decir: "cuánto se ha gastado en total, por cada categoría").

**`with('category:id,name')`** — trae también el nombre de cada categoría relacionada, limitando la consulta a solo esas dos columnas (`id` y `name`), para no traer datos innecesarios.

**`DATE_FORMAT(date, '%Y-%m')`** — una función de MySQL que reformatea una fecha completa (`2026-09-02`) a solo "año-mes" (`2026-09`), permitiendo agrupar todos los gastos de un mismo mes juntos, sin importar el día exacto en que ocurrieron.

### Rutas nuevas

Añadidas dentro del mismo grupo protegido por `auth:sanctum` en `routes/api.php`:

```php
use App\Http\Controllers\SummaryController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/summary/by-category', [SummaryController::class, 'byCategory']);
    Route::get('/summary/by-month', [SummaryController::class, 'byMonth']);
});
```

### Un obstáculo al probar: diferencia entre navegar y hacer `fetch`

Al visitar directamente `http://localhost/api/summary/by-category` desde la barra de direcciones del navegador (estando ya logueado en la app), la respuesta fue `{"message": "Unauthenticated."}`, a pesar de que la sesión seguía activa (confirmado visitando `/dashboard`, que sí cargó con normalidad).

**Causa:** una navegación directa por la barra de direcciones no es equivalente, en términos de cómo el navegador construye la petición, a un `fetch()` ejecutado desde dentro de la propia aplicación ya cargada (mismo origen, mismo contexto de ejecución). El middleware `EnsureFrontendRequestsAreStateful` de Sanctum reconoce correctamente las peticiones hechas desde dentro de la SPA, pero no necesariamente una navegación de nivel superior del navegador a esa misma URL.

**Cómo se confirmó la causa real:** en vez de insistir con la barra de direcciones o la consola del navegador (esta última bloqueada además por la protección "self-XSS" de Firefox, que exige escribir `permitir pegar` antes de admitir código pegado), se añadió temporalmente un botón de prueba dentro del propio componente `Expenses.jsx`:

```jsx
<button
    onClick={() => {
        fetch('/api/summary/by-category', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data) => alert(JSON.stringify(data, null, 2)));
    }}
    className="mb-4 rounded bg-blue-600 px-4 py-2 text-white"
>
    Probar resumen por categoría
</button>
```

Al hacer clic, el `fetch` se ejecutó desde dentro del mismo contexto que usan las demás llamadas de la app (que ya funcionaban correctamente), y esta vez sí devolvió los datos esperados. Esto confirmó que el backend estaba bien configurado, y que el problema anterior era exclusivamente de cómo se estaba probando, no del código. El botón se retiró después de confirmar esto.

### Frontend: instalación de Recharts

```bash
./vendor/bin/sail npm install recharts --legacy-peer-deps
```

**Problema encontrado:**
```
[plugin:vite:import-analysis] Failed to resolve import "react-is" from "node_modules/.vite/deps/recharts.js"
```

**Causa:** `react-is` es una dependencia que Recharts necesita internamente, pero no se instaló automáticamente — probablemente porque `--legacy-peer-deps` evita que npm resuelva con estrictez algunas dependencias transitivas (dependencias de las dependencias).

**Solución:**
```bash
./vendor/bin/sail npm install react-is --legacy-peer-deps
```
Seguido de reiniciar `npm run dev` (`Ctrl+C` y volver a ejecutarlo), para que Vite volviera a analizar las dependencias desde cero.

### Componente de gráficos

Se añadieron dos gráficos usando Recharts, alimentados por los nuevos endpoints:

```jsx
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
} from 'recharts';

// Transformación de los datos que llegan de la API al formato que espera Recharts
const categoryChartData = summaryByCategory.map((item) => ({
    name: item.category?.name || 'Sin categoría',
    total: parseFloat(item.total),
}));

const monthChartData = summaryByMonth.map((item) => ({
    month: item.month,
    total: parseFloat(item.total),
}));
```

```jsx
<ResponsiveContainer width="100%" height={250}>
    <BarChart data={categoryChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#1f2937" />
    </BarChart>
</ResponsiveContainer>

<ResponsiveContainer width="100%" height={250}>
    <LineChart data={monthChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#1f2937" />
    </LineChart>
</ResponsiveContainer>
```

**`parseFloat(item.total)`** — necesario porque la API devuelve el total como una cadena de texto (por ejemplo, `"20.00"`), típico de cómo MySQL/Eloquent representan los valores `DECIMAL` en JSON, y Recharts necesita números reales para dibujar el gráfico correctamente.

**`<ResponsiveContainer>`** — hace que el gráfico ajuste su tamaño automáticamente al espacio disponible de su contenedor, en vez de tener un ancho o alto fijo en píxeles.

**`<BarChart>` / `<LineChart>`** — los dos tipos de gráfico usados: barras para comparar el total entre categorías distintas, línea para ver la evolución del gasto mes a mes.

**`dataKey`** — indica, para cada pieza del gráfico (eje X, eje Y, la barra o la línea), de qué propiedad del objeto de datos debe tomar su valor.

También se cargan estos dos nuevos endpoints (`fetchSummaryByCategory`, `fetchSummaryByMonth`) dentro del mismo `Promise.all([...])` que ya traía categorías y gastos, para que todo se actualice junto cada vez que se crea, edita o elimina un registro.

---

## 20. Subida del proyecto a GitHub

### Preparación: revisión del `.gitignore`

Antes de inicializar el repositorio, se comprobó el `.gitignore` que Laravel genera por defecto:

```bash
cat .gitignore
```

Confirmó que excluye correctamente `.env` (credenciales), `/node_modules`, `/vendor`, y archivos de caché/IDE — justo lo que no debe subirse a un repositorio público.

### Inicialización del repositorio

```bash
git init
```

Como Git avisó que en el futuro (Git 3.0) el nombre por defecto de la rama principal cambiará, y hoy en día el estándar más extendido (y el que usa GitHub) es `main`, se renombró explícitamente:

```bash
git branch -m main
```

### Un problema encontrado antes del primer commit: archivos "basura" de Tinker

Al revisar `git status`, aparecieron varios archivos con nombres extraños en la raíz del proyecto:

```
category-
d
e->category->name
email
email-
er->categories()->create(['name' => 'Comida']);
er->email$user->email
name
```

**Causa:** en algún momento de una sesión anterior, se ejecutaron fragmentos de comandos de Tinker (como `$user->email` o `$user->categories()->create([...])`) directamente en la terminal de bash, en vez de dentro de la consola de Tinker. Bash interpretó caracteres como `>` (que en Tinker es parte de la sintaxis de acceso a propiedades/métodos, `->`) como un operador de **redirección de salida**, creando archivos literales con esos fragmentos como nombre.

**Solución:** se borraron manualmente con `rm`, usando comillas para poder pasar nombres de archivo con caracteres especiales:

```bash
rm "category-" "d" "e->category->name" "email" "email-" "er->categories()->create(['name' => 'Comida']);" "er->email\$user->email" "name"
```

Tras confirmar (con `ls` y comprobando que la app seguía funcionando con normalidad) que la limpieza no había afectado a nada del proyecto real, se continuó.

### Configuración de la identidad de Git

Al ser la primera vez que se usaba Git en esta máquina, se configuró globalmente (aplica a todos los repositorios futuros en este sistema, no solo a este proyecto):

```bash
git config --global user.name "Aisak"
git config --global user.email "corderogarcia4496@gmail.com"
```

### Autenticación con GitHub por SSH

En vez de usar usuario/contraseña (método que GitHub ya no acepta directamente para operaciones de Git desde hace tiempo), se configuró autenticación por clave SSH.

**Generación de la clave:**
```bash
ssh-keygen -t ed25519 -C "corderogarcia4496@gmail.com"
```
- `-t ed25519` — tipo de clave moderno y recomendado actualmente (más seguro y rápido que el antiguo RSA).
- `-C "..."` — un comentario asociado a la clave, normalmente el email, útil para identificarla si en el futuro se tienen varias.

Se aceptó la ubicación por defecto (`~/.ssh/id_ed25519`) y se dejó sin passphrase adicional (aceptable para un entorno de desarrollo personal).

Esto genera dos archivos:
- `~/.ssh/id_ed25519` — la clave **privada**. Nunca se comparte ni se sube a ningún sitio.
- `~/.ssh/id_ed25519.pub` — la clave **pública**. Esta sí se sube a GitHub; es segura de compartir por diseño.

**Registro en GitHub:**
```bash
cat ~/.ssh/id_ed25519.pub
```
Se copió el contenido completo (empieza por `ssh-ed25519 AAAA...` y termina con el email), y se añadió en GitHub desde: perfil → **Settings** → **SSH and GPG keys** → **New SSH key**.

**Verificación de la conexión:**
```bash
ssh -T git@github.com
```
Tras aceptar la huella del servidor la primera vez (`yes`), el mensaje `Hi <usuario>! You've successfully authenticated, but GitHub does not provide shell access.` confirmó que la autenticación quedó correctamente establecida (ese mensaje es el esperado y normal; no indica ningún problema).

### Primer commit y creación del repositorio remoto

```bash
git add .
git status   # confirmación visual de qué se va a subir
git commit -m "Proyecto inicial: gestor de gastos con Laravel, React, API REST y gráficos"
```

El repositorio remoto se creó manualmente desde la web de GitHub (`github.com/new`), como público, **sin** marcar las opciones de generar README, `.gitignore` o licencia automáticamente (para evitar un conflicto innecesario con los archivos que ya existían localmente).

### Conexión y subida

```bash
git remote add origin git@github.com:isaaccg96/gestor-gastos.git
git remote -v   # confirmación de que la URL remota quedó bien configurada
git push -u origin main
```

`-u origin main` vincula la rama local `main` con la rama `main` del repositorio remoto llamado `origin`, de forma que, a partir de este primer push, sea suficiente con `git push` a secas para subir cambios futuros.

Resultado: subida exitosa, repositorio visible públicamente en `https://github.com/isaaccg96/gestor-gastos`.

### Reemplazo del README genérico

El `README.md` que Laravel genera por defecto (centrado en explicar el framework en general) se sustituyó por uno específico del proyecto, con: descripción, stack tecnológico, lista de funcionalidades, explicación de la arquitectura híbrida Inertia/API REST, instrucciones de instalación con Sail, y estructura de carpetas.

```bash
git add README.md
git commit -m "Actualiza README con documentación del proyecto"
git push
```

Este segundo `push` ya no necesitó el flag `-u origin main`, al haber quedado establecida esa relación desde el primer push.

GitHub renderiza automáticamente el contenido de `README.md` en la página principal del repositorio, por lo que la verificación final se hizo simplemente visitando `https://github.com/isaaccg96/gestor-gastos` en el navegador.

---

## 21. Policies: seguridad entre usuarios

### El problema que resuelven

Hasta este punto, los controladores de `Category` y `Expense` usaban **Route Model Binding** (`Category $category` en los parámetros) para localizar automáticamente el registro correspondiente al ID recibido en la URL, pero **no comprobaban que ese registro perteneciera al usuario autenticado**. En teoría, un usuario autenticado podía intentar ver, editar o borrar un registro de otro usuario simplemente adivinando o probando su ID numérico.

Las **Policies** de Laravel centralizan la lógica de autorización ("¿puede este usuario realizar esta acción sobre este registro concreto?") en una clase dedicada por modelo, en vez de repetir esa comprobación a mano dentro de cada método de cada controlador.

### Creación de las policies

```bash
./vendor/bin/sail artisan make:policy CategoryPolicy --model=Category
./vendor/bin/sail artisan make:policy ExpensePolicy --model=Expense
```

Esto genera, en `app/Policies/`, una clase por modelo con varios métodos ya esbozados (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`), todos devolviendo `false` por defecto — una postura segura de partida, ya que cualquier método no implementado explícitamente deniega el acceso en vez de concederlo por accidente.

### Contenido final de `app/Policies/CategoryPolicy.php`

Se modificaron únicamente los métodos `view`, `update` y `delete`, dejando el resto (`viewAny`, `create`, `restore`, `forceDelete`) devolviendo `false`, sin usar:

```php
<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }

    public function restore(User $user, Category $category): bool
    {
        return false;
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return false;
    }
}
```

### Contenido final de `app/Policies/ExpensePolicy.php`

Mismo patrón, aplicado a `Expense`:

```php
<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Expense $expense): bool
    {
        return $user->id === $expense->user_id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Expense $expense): bool
    {
        return $user->id === $expense->user_id;
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $user->id === $expense->user_id;
    }

    public function restore(User $user, Expense $expense): bool
    {
        return false;
    }

    public function forceDelete(User $user, Expense $expense): bool
    {
        return false;
    }
}
```

La lógica central de ambas es idéntica: comparar el `id` del usuario autenticado con el campo `user_id` del registro. Si coinciden, el usuario es el dueño y la acción se permite; si no, se deniega.

### Verificación manual desde Tinker (antes de tocar los controladores)

Se comprobó primero que Laravel reconocía las policies automáticamente (en versiones recientes, se detectan por convención de nombres, `Category` → `CategoryPolicy`, sin necesitar un registro manual), usando el método `can()` disponible en cualquier modelo `User`:

```php
$user = App\Models\User::first();
$category = App\Models\Category::first();
$user->can('view', $category);   // true — el usuario es el dueño
```

Para probar el caso negativo (la parte que realmente importa verificar), se creó un segundo usuario de prueba:

```php
$otroUsuario = App\Models\User::create([
    'name' => 'Usuario Dos',
    'email' => 'usuario2@test.com',
    'password' => bcrypt('password123'),
    'email_verified_at' => now(),
]);

$otroUsuario->can('view', $category);   // false — no es el dueño
```

Ambos resultados fueron los esperados, confirmando que las policies, en sí mismas, funcionaban correctamente antes incluso de conectarlas a las rutas HTTP reales.

### Un obstáculo: `Undefined method 'authorize'`

Al intentar usar `$this->authorize(...)` dentro de los controladores (el método que aplica una policy automáticamente y devuelve un error 403 si no se cumple), apareció un aviso del analizador de código de VS Code (Intelephense): `Undefined method 'authorize'`.

**Diagnóstico:** se revisó el contenido de la clase base de la que heredan todos los controladores:
```bash
cat app/Http/Controllers/Controller.php
```
Reveló que, en esta versión del proyecto, la clase venía completamente vacía:
```php
abstract class Controller
{
    //
}
```

**Causa real (no solo una advertencia del editor):** el método `authorize()` no pertenece directamente a la clase `Controller`; lo aporta un trait de Laravel llamado `AuthorizesRequests`, que normalmente ya viene incluido en el `Controller` base de un proyecto recién creado, pero que en este caso no estaba presente. Por tanto, el aviso de Intelephense era correcto: el método efectivamente no existía todavía.

**Solución** — añadir el trait a la clase base:
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;
}
```

Al añadir el trait aquí (en la clase de la que heredan tanto `CategoryController` como `ExpenseController`), el método `authorize()` quedó disponible automáticamente en ambos, sin tener que repetir el `use` en cada controlador individual.

### Conexión de las policies a los controladores

Se añadió `$this->authorize(...)` al principio de los métodos `show`, `update` y `destroy` de ambos controladores (no hizo falta en `index`, que ya filtraba por `$request->user()->...`, ni en `store`, que siempre crea un registro nuevo para el propio usuario autenticado).

**`app/Http/Controllers/CategoryController.php`** (métodos modificados):
```php
public function show(Category $category)
{
    $this->authorize('view', $category);

    return $category;
}

public function update(Request $request, Category $category)
{
    $this->authorize('update', $category);

    $validated = $request->validate([
        'name' => 'required|string|max:255',
    ]);

    $category->update($validated);

    return $category;
}

public function destroy(Category $category)
{
    $this->authorize('delete', $category);

    $category->delete();

    return response()->noContent();
}
```

**`app/Http/Controllers/ExpenseController.php`** (métodos modificados):
```php
public function show(Expense $expense)
{
    $this->authorize('view', $expense);

    return $expense->load('category');
}

public function update(Request $request, Expense $expense)
{
    $this->authorize('update', $expense);

    $validated = $request->validate([
        'amount' => 'required|numeric|min:0',
        'description' => 'nullable|string|max:255',
        'date' => 'required|date',
        'category_id' => 'required|exists:categories,id',
    ]);

    $expense->update($validated);

    return $expense->load('category');
}

public function destroy(Expense $expense)
{
    $this->authorize('delete', $expense);

    $expense->delete();

    return response()->noContent();
}
```

**Qué hace `$this->authorize('view', $category)` en tiempo de ejecución:** localiza automáticamente la Policy correspondiente al tipo de modelo recibido (`Category` → `CategoryPolicy`), invoca el método indicado (`view`, `update` o `delete`) pasándole el usuario autenticado de la petición actual y el registro concreto, y si ese método devuelve `false`, lanza automáticamente una excepción que Laravel convierte en una respuesta HTTP **403 Forbidden** — sin necesidad de escribir ese manejo de errores a mano en cada sitio.

### Verificación final

Se probó primero el caso positivo desde el navegador (editar/eliminar una categoría o gasto propio), confirmando que seguía funcionando con normalidad — las policies no rompieron ningún flujo existente para el dueño legítimo de los datos.

Después, se repitió la verificación con `can()` desde Tinker, comparando explícitamente ambos usuarios sobre el mismo registro:

```php
$otroUsuario = App\Models\User::where('email', 'usuario2@test.com')->first();
$categoria = App\Models\Category::first();

$otroUsuario->can('view', $categoria);    // false
$otroUsuario->can('update', $categoria);  // false
$otroUsuario->can('delete', $categoria);  // false

$tuUsuario = App\Models\User::where('email', 'isaacdesarrollo44@gmail.com')->first();

$tuUsuario->can('view', $categoria);    // true
$tuUsuario->can('update', $categoria);  // true
$tuUsuario->can('delete', $categoria);  // true
```

Los seis resultados salieron como se esperaba, confirmando que la protección funciona correctamente en ambos sentidos: el dueño conserva pleno acceso, y cualquier otro usuario queda bloqueado.

### Subida a Git

```bash
git add .
git status   # confirmación de qué archivos se incluyen (controladores, Controller.php, las dos policies)
git commit -m "Añade Policies para restringir acceso a datos de otros usuarios"
git push
```

---

## 22. Glosario ampliado (segunda sesión)

**Agregación SQL (`SUM`, `GROUP BY`)** — operaciones que calculan un valor resumido (como una suma total) a partir de varias filas agrupadas por un criterio común (por ejemplo, sumar los montos de todos los gastos, agrupados por categoría o por mes).

**`selectRaw()`** — método de Eloquent que permite incluir una porción de SQL escrita directamente ("en crudo") dentro de una consulta, útil para funciones de agregación o de fecha que no tienen un atajo dedicado en la sintaxis normal del ORM.

**Recharts** — librería de gráficos para React, basada en componentes declarativos (`<BarChart>`, `<LineChart>`, etc.) en vez de dibujar directamente sobre un `<canvas>`.

**`ResponsiveContainer`** — componente de Recharts que ajusta el tamaño del gráfico automáticamente al espacio disponible de su contenedor padre.

**Policy** — una clase de Laravel dedicada a centralizar la lógica de autorización ("¿puede este usuario hacer esta acción sobre este registro?") para un modelo concreto, en vez de repetir esa comprobación dentro de cada controlador.

**`$this->authorize(...)`** — método (aportado por el trait `AuthorizesRequests`) que aplica automáticamente la Policy correspondiente a un modelo, devolviendo una respuesta 403 si el resultado es negativo.

**`AuthorizesRequests`** — trait de Laravel que añade el método `authorize()` a cualquier clase donde se use; normalmente se incluye en la clase base `Controller` para que esté disponible en todos los controladores del proyecto sin repetirlo.

**`$user->can('accion', $modelo)`** — forma de comprobar manualmente (por ejemplo, desde Tinker o dentro de una vista) si un usuario concreto tiene permiso para realizar una acción sobre un registro concreto, según lo que determine su Policy correspondiente.

**Clave SSH (pública/privada)** — un par de claves criptográficas usadas para autenticarse ante un servicio (como GitHub) sin necesidad de escribir usuario y contraseña en cada operación. La clave privada nunca se comparte; la clave pública sí, y es la que se registra en el servicio remoto.

**`git remote`** — la referencia a la ubicación de un repositorio en un servidor externo (como GitHub); `origin` es el nombre convencional que se le da al remoto principal de un proyecto.

**`git push -u origin main`** — sube los commits locales al repositorio remoto, y además establece una relación de seguimiento entre la rama local `main` y la rama remota `main`, de forma que los siguientes `push` no necesiten repetir esos parámetros.

---

## 23. Límite de presupuesto por categoría y barra de progreso

En una tercera sesión de trabajo se añadió la posibilidad de asignar un límite de gasto opcional a cada categoría, junto con una barra de progreso visual que muestra cuánto se ha gastado respecto a ese límite.

### Backend: nueva columna en `categories`

Como la migración original de `categories` ya se había aplicado, se creó una migración **nueva** que añade una columna a la tabla existente, en vez de modificar la migración original (una migración ya aplicada no debe editarse retroactivamente):

```bash
./vendor/bin/sail artisan make:migration add_budget_limit_to_categories_table --table=categories
```

Contenido de la migración:

```php
public function up(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->decimal('budget_limit', 10, 2)->nullable()->after('name');
    });
}

public function down(): void
{
    Schema::table('categories', function (Blueprint $table) {
        $table->dropColumn('budget_limit');
    });
}
```

**`Schema::table(...)`** — a diferencia de `Schema::create(...)` (usado para tablas nuevas), este método se usa para **modificar** una tabla ya existente.

**`->nullable()`** — el límite es opcional; una categoría sin límite definido simplemente no mostrará la barra de progreso en el frontend.

**`->after('name')`** — puramente cosmético, ubica la columna nueva justo después de `name` al inspeccionar la tabla.

**`down()`** — define cómo deshacer esta migración concreta (elimina la columna), independientemente de las demás migraciones del proyecto.

Se aplicó con:
```bash
./vendor/bin/sail artisan migrate
```

### Backend: modelo y controlador

En `app/Models/Category.php`, se añadió el nuevo campo a la asignación masiva:
```php
protected $fillable = ['name', 'user_id', 'budget_limit'];
```

En `app/Http/Controllers/CategoryController.php`, se añadió la validación del nuevo campo en `store` y `update`:
```php
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'budget_limit' => 'nullable|numeric|min:0',
]);
```

Y el método `index()` se modificó para incluir, junto a cada categoría, el total ya gastado en ella:

```php
public function index(Request $request)
{
    return $request->user()
        ->categories()
        ->withSum('expenses', 'amount')
        ->latest()
        ->get();
}
```

**`withSum('expenses', 'amount')`** — un atajo de Eloquent que calcula, para cada categoría del listado, la suma de la columna `amount` de todos sus gastos relacionados (usando la relación `expenses()` ya definida en el modelo), añadiendo el resultado como un atributo nuevo llamado `expenses_sum_amount` en cada categoría devuelta. Cumple, en un solo paso eficiente, un propósito similar al `selectRaw`/`groupBy` usado en `SummaryController`, pero aplicado directamente sobre el propio listado de categorías en vez de sobre un endpoint aparte.

### Frontend: formulario con el nuevo campo

Se añadió un input numérico opcional en el formulario de creación de categorías, junto con el estado correspondiente:

```jsx
const [newCategoryBudget, setNewCategoryBudget] = useState('');
```

```jsx
<input
    type="number"
    step="0.01"
    min="0"
    value={newCategoryBudget}
    onChange={(e) => setNewCategoryBudget(e.target.value)}
    placeholder="Límite (opcional)"
    className="w-40 rounded border-gray-300 shadow-sm"
/>
```

Y el envío del formulario se actualizó para incluir el campo:

```jsx
body: JSON.stringify({
    name: newCategoryName,
    budget_limit: newCategoryBudget || null,
}),
```

**`newCategoryBudget || null`** — si el campo se deja vacío, su valor en React es una cadena vacía (`""`), que en JavaScript se evalúa como "falsy". El operador `||` hace que, en ese caso, se envíe `null` en su lugar, que es el valor que el backend espera para "sin límite" (recordando que el campo es `nullable`).

### Frontend: cálculo y visualización de la barra de progreso

Se añadió una función auxiliar para calcular el porcentaje gastado y el color correspondiente:

```jsx
const getBudgetProgress = (category) => {
    const spent = parseFloat(category.expenses_sum_amount) || 0;
    const limit = parseFloat(category.budget_limit);

    if (!limit || limit <= 0) {
        return null;
    }

    const percentage = Math.min((spent / limit) * 100, 100);

    let color = 'bg-green-500';
    if (percentage >= 100) {
        color = 'bg-red-500';
    } else if (percentage >= 80) {
        color = 'bg-yellow-500';
    }

    return { spent, limit, percentage, color };
};
```

**`parseFloat(category.expenses_sum_amount) || 0`** — el total gastado llega como cadena de texto desde la API; si una categoría no tiene ningún gasto todavía, ese campo puede venir como `null`, y `parseFloat(null)` da `NaN`. El `|| 0` cubre ese caso, tratándolo como "0 gastado".

**`if (!limit || limit <= 0) return null`** — si la categoría no tiene límite definido (o el valor no tiene sentido, como 0 o negativo), la función no calcula nada; el componente usa este `null` para decidir que no debe mostrarse ninguna barra para esa categoría.

**`Math.min((spent / limit) * 100, 100)`** — calcula el porcentaje gastado respecto al límite, pero topándolo en 100 para que la barra visual nunca se salga de su contenedor, aunque el gasto real haya superado el límite (el dato exacto de cuánto se gastó se sigue mostrando aparte, sin ese tope).

**Los umbrales de color** — verde por defecto, amarillo a partir del 80% del límite, rojo al llegar o superar el 100%. Son valores de diseño elegidos para este proyecto, ajustables cambiando esos dos números.

En la lista de categorías, se añadió la barra dentro de cada elemento:

```jsx
{getBudgetProgress(category) && (
    <div className="mt-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
                className={`h-full ${getBudgetProgress(category).color} transition-all`}
                style={{
                    width: `${getBudgetProgress(category).percentage}%`,
                }}
            />
        </div>
        <p className="mt-1 text-xs text-gray-500">
            {getBudgetProgress(category).spent.toFixed(2)}€ de{' '}
            {getBudgetProgress(category).limit.toFixed(2)}€
        </p>
    </div>
)}
```

**Renderizado condicional (`{condicion && (...)}`)** — si `getBudgetProgress` devuelve `null` (categoría sin límite), no se dibuja nada de esta sección; solo aparece la barra cuando hay un valor real que mostrar.

**`style={{ width: ... }}`** — el ancho de la barra interior se calcula dinámicamente como un porcentaje concreto, algo que no puede expresarse con una clase predefinida de Tailwind (no existe, por ejemplo, una clase `w-73%`), así que aquí se usa el atributo `style` directo de React en vez de una clase de utilidad.

**`.toFixed(2)`** — formatea los números con exactamente dos decimales, para que se vean como cantidades de dinero (`45.00€`, no `45€` ni `45.5€`).

### Un ajuste de layout necesario

Al añadir la barra dentro del bloque del nombre de la categoría, ese bloque creció en altura, y los botones de "Editar"/"Eliminar" (alineados verticalmente al centro del elemento de la lista) quedaron visualmente pegados a la barra. La solución elegida fue mantener la alineación centrada del `<li>` tal como estaba, y en su lugar añadir un pequeño espacio de separación horizontal al contenedor del nombre y la barra:

```jsx
<div className="flex-1 pr-4">
```

El `pr-4` (padding-right) crea un margen entre ese bloque y la zona de los botones, sin necesitar cambiar la alineación vertical general del elemento.

---

## 24. Enlace de navegación a Gastos

Para no depender de escribir la URL `/expenses` manualmente cada vez, se añadió un enlace en el menú de navegación superior del layout compartido por todas las páginas autenticadas (`resources/js/Layouts/AuthenticatedLayout.jsx`), junto al enlace ya existente de "Dashboard".

**En el menú de escritorio:**
```jsx
<NavLink
    href={route('expenses')}
    active={route().current('expenses')}
>
    Gastos
</NavLink>
```

**En el menú móvil (desplegable):**
```jsx
<ResponsiveNavLink
    href={route('expenses')}
    active={route().current('expenses')}
>
    Gastos
</ResponsiveNavLink>
```

**`route('expenses')`** — genera la URL correspondiente a la ruta con nombre `expenses`, definida previamente en `routes/web.php` (`Route::get('/expenses', ...)->name('expenses')`). Esta función la proporciona **Ziggy**, una librería que Breeze instala por defecto para poder referenciar rutas de Laravel por su nombre desde JavaScript, en vez de escribir URLs a mano — si la URL cambiara en el backend en el futuro, el enlace se actualizaría solo, sin tocar el frontend.

**`active={route().current('expenses')}`** — resalta visualmente el enlace (con los estilos que ya trae `NavLink`/`ResponsiveNavLink` de Breeze) cuando el usuario se encuentra actualmente en esa página.

---

## 25. Suite de tests automatizados con Pest

Tras completar las funcionalidades anteriores, se dedicó una sesión a escribir tests automatizados, cubriendo las partes más críticas del proyecto: autorización (Policies), validación de datos, y corrección de los cálculos de resumen.

### Preparación: configuración de la base de datos de pruebas

Se revisó primero la configuración existente en `tests/Pest.php`:

```php
pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
```

**`RefreshDatabase`** — un trait de Laravel que hace que cada test se ejecute sobre una base de datos limpia, restablecida automáticamente. Esto garantiza que los tests no toquen ni ensucien los datos reales de desarrollo (usuarios, categorías y gastos creados manualmente durante las sesiones anteriores).

Se comprobó que `phpunit.xml` definía `DB_DATABASE=testing`, pero sin especificar `DB_CONNECTION`, lo que hacía que los tests intentaran usar el motor MySQL configurado en `.env`, apuntando a una base de datos llamada `testing` que no existía dentro del contenedor de MySQL de Sail.

**Solución elegida — usar SQLite en memoria para los tests**, en vez de crear una base de datos MySQL adicional. Es el enfoque más común en proyectos Laravel para testing, por ser considerablemente más rápido (no hay conexión de red al contenedor de base de datos; todo ocurre en memoria RAM durante la ejecución) y no depender de infraestructura adicional.

Primero se comprobó que las extensiones necesarias estuvieran disponibles dentro del contenedor:
```bash
./vendor/bin/sail php -m | grep -i sqlite
```
Confirmó la presencia de `pdo_sqlite` y `sqlite3`.

Se editó `phpunit.xml`, sustituyendo la línea de `DB_DATABASE` existente por dos líneas nuevas:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

**`DB_CONNECTION=sqlite`** — indica a Laravel que, durante la ejecución de tests, use el driver de SQLite en vez de MySQL.

**`DB_DATABASE=:memory:`** — un valor especial reconocido por SQLite que significa "no uses un archivo en disco; crea la base de datos completamente en memoria RAM". Se genera vacía al iniciar cada ejecución de tests (aplicando todas las migraciones sobre ella) y desaparece al terminar, sin dejar ningún rastro persistente.

**Nota sobre edición de archivos:** un primer intento de editar `phpunit.xml` manualmente en VS Code no se guardó correctamente (el archivo seguía mostrando el valor antiguo al revisarlo por terminal). Se resolvió aplicando el cambio directamente desde la terminal con `sed`:
```bash
sed -i 's/<env name="DB_DATABASE" value="testing"\/>/<env name="DB_CONNECTION" value="sqlite"\/>\n        <env name="DB_DATABASE" value=":memory:"\/>/' phpunit.xml
```

Se verificó el funcionamiento corriendo primero los tests ya existentes (generados por Breeze):
```bash
./vendor/bin/sail artisan test
```
Resultado: 25 tests pasando en menos de 2 segundos, confirmando que la infraestructura de testing (SQLite en memoria + `RefreshDatabase` + migraciones) quedó correctamente configurada antes de escribir ningún test propio.

### Un requisito previo: `HasFactory` en los modelos

Al intentar usar `Category::factory()` en un test, apareció el error:
```
BadMethodCallException: Call to undefined method App\Models\Category::factory()
```

**Causa:** a diferencia del modelo `User` (que Laravel genera ya con el trait `HasFactory` incluido por defecto), los modelos `Category` y `Expense`, creados con `artisan make:model`, no incluyeron ese trait automáticamente. Sin él, Eloquent no sabe relacionar el modelo con su clase de factory correspondiente, aunque el archivo de la factory exista.

**Solución** — se añadió el trait a ambos modelos:

```php
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;
    // ...
}
```

(Y de forma equivalente en `Expense.php`.)

### Factories creadas

**`database/factories/CategoryFactory.php`:**
```php
public function definition(): array
{
    return [
        'name' => $this->faker->word(),
        'user_id' => \App\Models\User::factory(),
        'budget_limit' => $this->faker->randomFloat(2, 50, 500),
    ];
}
```

**`database/factories/ExpenseFactory.php`:**
```php
public function definition(): array
{
    return [
        'amount' => $this->faker->randomFloat(2, 5, 200),
        'description' => $this->faker->sentence(3),
        'date' => $this->faker->dateTimeThisYear(),
        'user_id' => User::factory(),
        'category_id' => Category::factory(),
    ];
}
```

**Qué es una factory** — una clase que genera datos de prueba realistas pero falsos (mediante la librería Faker, incluida con Laravel), evitando tener que especificar manualmente cada campo de cada modelo de prueba dentro de cada test.

**`'user_id' => User::factory()`** — si un test crea una categoría o un gasto sin especificar explícitamente a qué usuario pertenece, la factory genera automáticamente un usuario nuevo para satisfacer esa relación. Es un patrón habitual en factories que representan modelos con relaciones obligatorias.

### Tests de Policies (`CategoryPolicyTest.php` y `ExpensePolicyTest.php`)

Se creó un test por cada combinación relevante de acción (`view`, `update`, `delete`) y situación (dueño / no dueño), replicando de forma automatizada las comprobaciones que antes se habían hecho manualmente desde Tinker:

```php
it('impide a otro usuario ver una categoría ajena', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('view', $category))->toBeFalse();
});
```

**`it('descripción', function () { ... })`** — la sintaxis característica de Pest: una descripción en lenguaje natural de qué comprueba el test, seguida del código que lo verifica.

**`expect(...)->toBeTrue()` / `->toBeFalse()`** — las aserciones de Pest (equivalentes a `assertTrue()`/`assertFalse()` en la sintaxis clásica de PHPUnit, pero más legibles).

Resultado: 4 tests para `Category` y 4 para `Expense`, los 8 en verde.

### Tests de validación (`CategoryValidationTest.php`)

A diferencia de los tests de Policies (que probaban el modelo de forma aislada), estos tests hacen peticiones HTTP reales contra la propia aplicación, comprobando la cadena completa: ruta, middleware, controlador y validación juntos.

```php
it('no permite crear una categoría sin nombre', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/categories', [
        'name' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('name');
});
```

**`$this->actingAs($user)`** — simula que la petición proviene de un usuario ya autenticado, sin necesitar iniciar sesión con contraseña dentro del propio test.

**`->postJson(...)`** — ejecuta una petición HTTP simulada (sin salir realmente a la red) contra la aplicación, del mismo modo en que lo haría React con `fetch`.

**`assertStatus(422)`** — confirma el código de respuesta HTTP exacto esperado (422, la convención de Laravel para errores de validación).

**`assertJsonValidationErrors('name')`** — comprueba, además del código, que el cuerpo de la respuesta JSON señale específicamente el campo `name` como el causante del error, y no otro campo distinto.

Se incluyó también un caso sin `actingAs`, para confirmar que sin autenticación la petición se rechaza con 401 antes incluso de llegar a la validación — verificando así, de forma automatizada, que el middleware `auth:sanctum` sigue protegiendo la ruta correctamente.

Resultado: 4 tests, los 4 en verde.

### Tests de agregaciones (`SummaryTest.php`)

Estos tests cubren la parte más propensa a errores silenciosos del proyecto: un fallo en una agrupación SQL no lanza ninguna excepción, simplemente produce un número incorrecto sin ningún aviso.

```php
it('calcula correctamente el total gastado por categoría', function () {
    $user = User::factory()->create();
    $comida = Category::factory()->create(['user_id' => $user->id, 'name' => 'Comida']);
    $transporte = Category::factory()->create(['user_id' => $user->id, 'name' => 'Transporte']);

    Expense::factory()->create(['user_id' => $user->id, 'category_id' => $comida->id, 'amount' => 20]);
    Expense::factory()->create(['user_id' => $user->id, 'category_id' => $comida->id, 'amount' => 30]);
    Expense::factory()->create(['user_id' => $user->id, 'category_id' => $transporte->id, 'amount' => 15]);

    $response = $this->actingAs($user)->getJson('/api/summary/by-category');

    $comidaTotal = collect($response->json())->firstWhere('category_id', $comida->id);

    expect((float) $comidaTotal['total'])->toBe(50.0);
});
```

**`collect($response->json())`** — convierte la respuesta JSON en una **Collection** de Laravel, una estructura que ofrece numerosos métodos de manipulación de listas de datos (filtrar, buscar, transformar), más cómoda de usar dentro de un test que manipular un array plano de PHP a mano.

**`firstWhere('category_id', $comida->id)`** — busca, dentro de la colección de resultados, el elemento cuyo `category_id` coincida con el de la categoría "Comida", sin depender del orden en que la API haya devuelto los resultados.

El segundo test de este archivo verifica específicamente que los gastos de **otro usuario** (999€, deliberadamente un valor muy distinguible) no aparezcan mezclados en el resumen del usuario autenticado, confirmando que el filtrado por usuario sigue aplicándose correctamente incluso dentro de una consulta con agregaciones.

Resultado: 2 tests, ambos en verde.

### Resultado final de la suite completa

```bash
./vendor/bin/sail artisan test
```

**39 tests pasando, 80 aserciones, ejecutados en menos de 2 segundos**: los 25 tests originales generados por Breeze (autenticación, perfil) más los 14 tests propios (Policies, validación, agregaciones), todos corriendo juntos sin conflictos sobre la base de datos SQLite en memoria.

---

## 26. Glosario ampliado (tercera sesión)

**`Schema::table(...)`** — método usado para modificar una tabla ya existente (añadir, eliminar o cambiar columnas), a diferencia de `Schema::create(...)`, reservado para tablas nuevas.

**`withSum('relacion', 'columna')`** — atajo de Eloquent que añade, a cada resultado de una consulta, la suma de una columna de sus registros relacionados (por ejemplo, el gasto total de cada categoría), sin necesidad de escribir una consulta de agregación por separado.

**Ziggy** — una librería incluida por defecto en las instalaciones de Breeze que permite generar URLs de rutas de Laravel por su nombre (`route('nombre')`) desde código JavaScript, en vez de escribirlas literalmente.

**Factory (Eloquent)** — una clase que define cómo generar, de forma automática y con datos realistas pero falsos, instancias de prueba de un modelo, para usarlas en tests sin tener que especificar cada campo manualmente.

**Faker** — la librería que las factories de Laravel usan por debajo para generar esos datos falsos (nombres, textos, números, fechas) de forma realista.

**`HasFactory`** — el trait que debe incluirse en un modelo Eloquent para que pueda usarse con el método estático `::factory()`; no se añade automáticamente al crear un modelo con `artisan make:model`, salvo en el caso del modelo `User`, que Laravel genera con él ya incluido.

**SQLite en memoria (`:memory:`)** — un modo de funcionamiento de SQLite donde la base de datos completa vive únicamente en memoria RAM durante la ejecución del programa, sin persistir en ningún archivo; habitual en proyectos Laravel para acelerar la ejecución de tests y evitar depender de un motor de base de datos externo como MySQL.

**`RefreshDatabase`** — un trait de testing de Laravel que restablece automáticamente el estado de la base de datos antes de cada test, garantizando que ninguno de ellos vea datos dejados por otro test anterior (ni por los datos reales de desarrollo).

**`$this->actingAs($usuario)`** — método disponible en los tests de Laravel para simular que una petición proviene de un usuario ya autenticado, sin necesidad de ejecutar un login real con contraseña dentro del test.

**`postJson()` / `getJson()`** — métodos de testing que ejecutan peticiones HTTP simuladas (sin salir realmente a la red) contra la propia aplicación, permitiendo probar rutas, middleware, controladores y validación de forma conjunta, tal como los usaría un cliente real.

**Collection (Laravel)** — una estructura de datos que envuelve un array y ofrece numerosos métodos encadenables para filtrar, transformar o buscar dentro de él (`firstWhere`, `pluck`, `map`, entre otros), usada tanto en el código de la aplicación como, en este caso, dentro de los propios tests.

---

## 27. Qué queda pendiente

Actualizado tras la tercera sesión de trabajo:

1. **Validación visual de errores** — mostrar en la interfaz los mensajes de error específicos que devuelve el backend cuando falla una validación, en vez de solo un mensaje genérico.
2. **Editar el límite de presupuesto de una categoría ya existente** — actualmente el formulario de edición de categorías solo permite cambiar el nombre; el límite se puede definir al crear, pero no modificar después desde la interfaz.
3. **Filtros en la interfaz** — ver los gastos de un mes concreto o de una categoría concreta, aprovechando que el backend ya soporta ese tipo de consultas con poco esfuerzo adicional.
4. **Aviso al superar el presupuesto** — mostrar algún mensaje o notificación cuando un gasto nuevo hace que una categoría supere su límite definido.
5. **Gastos recurrentes** — la posibilidad de marcar un gasto como periódico (alquiler, suscripciones), para no tener que introducirlo manualmente cada mes.
6. **Exportar datos** — un botón para descargar los gastos (por ejemplo, de un mes concreto) en formato CSV.
7. **Paginación** — el endpoint `index()` de gastos trae actualmente todos los registros de golpe; conviene limitar y paginar los resultados antes de que la cantidad de datos crezca.
8. **Capturas de pantalla en el README** — para mostrar visualmente cómo se ve la aplicación (por ejemplo, el listado con las barras de progreso y los gráficos) a quien visite el repositorio, sin depender solo de la descripción en texto.
9. **Despliegue en un servicio gratuito** (Railway, Render, u otro similar) — para disponer de una URL pública y funcionando, sin que quien revise el proyecto tenga que clonarlo y levantarlo localmente.

### Completado hasta ahora (para referencia rápida)

- ✅ Entorno de desarrollo completo (Docker, Sail, Laravel, MySQL, React + Inertia)
- ✅ Modelos y relaciones (User → Categories → Expenses)
- ✅ API REST completa, protegida con Sanctum
- ✅ Auth híbrida: Inertia para login/registro, cookie-based Sanctum para la API
- ✅ CRUD completo en React puro (crear, leer, editar, eliminar)
- ✅ Resumen agregado (por categoría y por mes) con gráficos en Recharts
- ✅ Proyecto subido a GitHub, con README específico del proyecto
- ✅ Policies de autorización, verificadas en ambos sentidos (dueño / no dueño)
- ✅ Límite de presupuesto opcional por categoría, con barra de progreso visual (verde/amarillo/rojo)
- ✅ Enlace de navegación a "Gastos" en el menú superior (escritorio y móvil)
- ✅ Suite de 39 tests automatizados con Pest (Policies, validación, agregaciones), corriendo sobre SQLite en memoria
