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
19. [Qué queda pendiente](#19-qué-queda-pendiente)

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

## 19. Qué queda pendiente

Anotado tal como se dejó al cierre de la sesión, sin desarrollar todavía:

1. **Policies de Laravel** — para impedir que un usuario autenticado pueda ver, editar o eliminar categorías o gastos que pertenecen a otro usuario (actualmente los controladores solo verifican que el registro exista, no que pertenezca al usuario autenticado).
2. **Validación visual de errores** — mostrar en la interfaz los mensajes de error específicos que devuelve el backend cuando falla una validación (por ejemplo, si el monto queda vacío).
3. **Un resumen o gráfico** — por ejemplo, total gastado por categoría o por mes, aprovechando las relaciones y agregaciones ya disponibles en el modelo de datos.
4. **Subir el proyecto a GitHub**, con un `README.md` que explique cómo levantar el proyecto con Sail (`git clone` + `./vendor/bin/sail up`), pensado para que cualquiera pueda ejecutarlo sin más que tener Docker instalado.
