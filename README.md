# 💼 Sistema de Gestión de Caja Chica Empresarial (PWA)
## 📋 Documento Técnico de Entrega y Puesta en Producción (Área de TI)

> **Versión del Sistema:** `1.0.0-PROD`  
> **Fecha de Entrega:** Octubre 2026  
> **Destinatario:** Área de Tecnologías de la Información, Infraestructura y Soporte  
> **Tipo de Aplicación:** Progressive Web App (PWA) Full-Stack con Soporte Offline, TIEMPO REAL y API REST  

---

## 📑 Tabla de Contenidos

1. [Ficha Técnica del Proyecto](#1-ficha-técnica-del-proyecto)
2. [Arquitectura de la Solución](#2-arquitectura-de-la-solución)
3. [Estructura del Repositorio](#3-estructura-del-repositorio)
4. [Requisitos Previos de Infraestructura](#4-requisitos-previos-de-infraestructura)
5. [Variables de Entorno y Configuración de Secretos](#5-variables-de-entorno-y-configuración-de-secretos)
6. [Guía de Instalación y Despliegue](#6-guía-de-instalación-y-despliegue)
   - [6.1 Entorno de Desarrollo Local](#61-entorno-de-desarrollo-local)
   - [6.2 Despliegue en Servidor de Producción (VPS / On-Premise con Node.js + Nginx)](#62-despliegue-en-servidor-de-producción-vps--on-premise)
   - [6.3 Despliegue Serverless / Cloud (Vercel + Supabase)](#63-despliegue-serverless--cloud)
7. [Base de Datos y Persistencia (Supabase / PostgreSQL)](#7-base-de-datos-y-persistencia)
8. [Integraciones Externas y Servicios de Terceros](#8-integraciones-externas-y-servicios-de-terceros)
9. [Seguridad, Autenticación y Matriz de Roles](#9-seguridad-autenticación-y-matriz-de-roles)
10. [Catálogo de Endpoints API REST](#10-catálogo-de-endpoints-api-rest)
11. [Mecanismos de Resiliencia y Modo Offline](#11-mecanismos-de-resiliencia-y-modo-offline)
12. [Mantenimiento, Respaldo y Monitoreo](#12-mantenimiento-respaldo-y-monitoreo)
13. [Checklist de Recepción y Pase a Producción para TI](#13-checklist-de-recepción-y-pase-a-producción-para-ti)
14. [Usuarios y Credenciales Semilla para QA](#14-usuarios-y-credenciales-semilla-para-qa)

---

## 1. Ficha Técnica del Proyecto

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre del Sistema** | Sistema Corporativo de Caja Chica PWA |
| **Propósito** | Digitalización integral de solicitudes de adelanto de efectivo, rendiciones de gastos corporativos con comprobantes tributarios, flujo de aprobación gerencial, abonos de caja, control de arqueo y liquidación contable. |
| **Frontend** | React 19.3.0, Vite 8.3.3, Vanilla CSS (Diseño responsivo / Dark Glassmorphic), Lucide Icons. |
| **Backend API** | Node.js (>= 18.x LTS), Express 5.2.1, SheetJS (`xlsx`), JSZip. |
| **Base de Datos** | PostgreSQL 15+ gestionado mediante Supabase (con suscripción Realtime vía WebSockets). |
| **Capacidades PWA** | Web App Manifest (`manifest.json`), Service Worker (`public/sw.js`), Cache API, Web Audio API, Push Notifications. |
| **Entornos Soportados** | Web Móvil (Android / iOS), Escritorio (Windows / macOS / Linux), Tablets corporativas. |

---

## 2. Arquitectura de la Solución

```
                                      ┌─────────────────────────────────────────┐
                                      │        CLIENTES / USUARIOS PWA          │
                                      │   (Smartphones, Tablets, Escritorio)    │
                                      └────────────────────┬────────────────────┘
                                                           │
                                                           ▼ HTTPS / WSS
                                      ┌─────────────────────────────────────────┐
                                      │        PROXY INVERSO / SERVIDOR         │
                                      │          (Nginx / Caddy / Cloud)        │
                                      └─────────────┬───────────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
   ┌───────────────────────────┐                                         ┌───────────────────────────┐
   │    FRONTEND ESTÁTICO      │                                         │      BACKEND API REST     │
   │       Vite / React        │                                         │     Express.js (Node.js)  │
   │  • PWA Service Worker     │                                         │  • /api/health            │
   │  • State Store Reactivo   │                                         │  • /api/export-excel      │
   │  • Fallback Offline       │                                         │  • Servidor SPA estático  │
   └─────────────┬─────────────┘                                         └─────────────┬─────────────┘
                 │                                                                     │
                 │                                                                     │
                 ▼                                                                     │
   ┌──────────────────────────────────────────────────────────────────┐                │
   │                   SERVICIOS CLOUD / BASE DE DATOS                │                │
   │                                                                  │◄───────────────┘
   │  • Supabase (PostgreSQL 15): Tablas operativas y RLS             │
   │  • Supabase Realtime: Sincronización instantánea WebSockets      │
   │  • OneSignal: Envío y gestión de Push Notifications              │
   │  • Factiliza API: Validación de RUC y Razón Social (SUNAT)       │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura del Repositorio

A continuación se detalla la función de cada directorio y archivo principal para facilitar la auditoría de código por parte de TI:

```text
CAJA_CHICA/
├── .env.example                 # Plantilla de variables de entorno requeridas
├── index.html                   # Entry point HTML del cliente PWA con meta-tags PWA
├── package.json                 # Declaración de dependencias frontend y backend
├── server.js                    # Servidor Node.js Express (API REST y entrega estática)
├── vercel.json                  # Configuración de despliegue en Vercel (si aplica)
├── vite.config.js               # Configuración de empaquetado Vite y plugins
├── MANUAL_DE_USUARIO_Y_FLUJO.md # Manual funcional paso a paso para usuarios finales
├── README.md                    # Esta guía técnica oficial de entrega a TI
│
├── public/                      # Archivos estáticos públicos
│   ├── favicon.ico              # Icono corporativo
│   ├── manifest.json            # Manifiesto PWA para instalación en móviles/desktop
│   └── sw.js                    # Service Worker (Caché offline y notificaciones Push)
│
├── supabase/                    # Scripts DDL de base de datos
│   └── schema.sql               # Esquema SQL completo: Tablas, Realtime, RLS y Seeds
│
└── src/                         # Código fuente del cliente React
    ├── main.jsx                 # Bootstrap de React
    ├── App.jsx                  # Orquestador principal, navegación y eventos globales
    ├── index.css                # Sistema de diseño CSS base (variables y temas)
    │
    ├── assets/                  # Recursos gráficos locales
    │
    ├── lib/                     # Capa de servicios, lógica transversal y persistencia
    │   ├── audioNotifier.js     # Sintetizador de tonos audibles con Web Audio API
    │   ├── excelExporter.js     # Generador de hojas de cálculo .xlsx en el cliente
    │   ├── factilizaService.js  # Consumo de API para validación de RUC ante SUNAT
    │   ├── notifRouting.js      # Router y despachador de notificaciones (Push / In-App)
    │   ├── store.js             # Gestor de estado unificado (Supabase + LocalStorage Fallback)
    │   └── zipExporter.js       # Empaquetador masivo de comprobantes adjuntos en .ZIP
    │
    └── components/              # Componentes de interfaz de usuario por rol
        ├── Navbar.jsx           # Barra superior con estado de conexión, balance y perfil
        ├── LoginModal.jsx       # Modal de acceso por DNI con perfiles demo
        ├── FormularioIngreso.jsx# Registro de solicitudes de anticipo y gastos
        ├── MisSolicitudes.jsx   # Bandeja de seguimiento del colaborador solicitante
        ├── ModuloAprobacion.jsx # Bandeja de aprobación y pago para Administradores
        ├── ModuloArqueo.jsx     # Tablero de control de fondos, arqueos y caja
        ├── ModuloReportes.jsx   # Generación de reportes avanzados y liquidación contable
        ├── MaestroDni.jsx       # Administración de usuarios y roles (Exclusivo SYSADMIN)
        ├── MaestroCategorias.jsx# Configuración de categorías de gasto y centros de costo
        ├── ModalRendicion.jsx   # Modal para rendir comprobantes de un adelanto
        ├── ModalAbono.jsx       # Modal de registro de entrega física/digital de dinero
        ├── ModalLiquidacion.jsx # Cierre y emisión de carátula de liquidación oficial
        └── SupabaseConfigModal.jsx # Interfaz para configurar credenciales en caliente
```

---

## 4. Requisitos Previos de Infraestructura

Para el despliegue del sistema por parte del equipo de TI, el servidor debe cumplir con:

- **Sistema Operativo:** Ubuntu Server 20.04/22.04 LTS, Debian 11/12, RedHat/Rocky Linux 9, o Windows Server 2019/2022.
- **Node.js:** Versión `18.x LTS` o `20.x LTS` (Recomendado: `v20.18.x`).
- **NPM:** Versión `9.x` o superior.
- **Memoria RAM:** Mínimo `1 GB` (Recomendado `2 GB` para ejecución fluida de builds y Node.js).
- **Almacenamiento:** Mínimo `1 GB` de espacio libre en disco.
- **Certificado SSL / HTTPS:** **Obligatorio en producción**. Los estándares de Service Worker, PWA y Web Push Notifications son bloqueados por los navegadores si no se ejecutan sobre HTTPS (a excepción de `localhost`).
- **Conectividad Saliente:**
  - Puerto `443` hacia los servidores de Supabase (`*.supabase.co`).
  - Puerto `443` hacia OneSignal (`onesignal.com`).
  - Puerto `443` hacia la API de Factiliza / SUNAT (`api.factiliza.com`).

---

## 5. Variables de Entorno y Configuración de Secretos

Cree un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```bash
cp .env.example .env
```

### Tabla de Variables

| Variable | Tipo | Obligatorio | Descripción / Uso |
| :--- | :---: | :---: | :--- |
| `VITE_SUPABASE_URL` | Frontend | Sí (Prod) | URL del proyecto Supabase (ej: `https://xyzcompany.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Sí (Prod) | Clave pública (`anon-key`) de Supabase para consultas del cliente. |
| `VITE_ONESIGNAL_APP_ID` | Frontend | Opcional | App ID del proyecto en OneSignal para notificaciones Push web. |
| `VITE_ONESIGNAL_REST_KEY` | Backend | Opcional | Clave REST de OneSignal para disparar notificaciones desde servidor. |
| `PORT` | Backend | No | Puerto TCP donde escuchará el servidor Node.js (por defecto `3001`). |
| `VITE_FACTILIZA_TOKEN` | Frontend | Opcional | Token Bearer para consultar RUC en la API de Factiliza / SUNAT. |

> ⚠️ **Nota de Seguridad para TI:** Las variables con prefijo `VITE_` son inyectadas en tiempo de compilación al bundle cliente. No almacene en ellas claves `service_role` de Supabase ni credenciales maestras de base de datos.

---

## 6. Guía de Instalación y Despliegue

### 6.1 Entorno de Desarrollo Local

Para pruebas internas de TI o desarrolladores:

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd CAJA_CHICA

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# (Editar .env con los valores de prueba)

# 4. Iniciar Frontend y Backend en paralelo
npm start
```
- **Frontend Vite:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

---

### 6.2 Despliegue en Servidor de Producción (VPS / On-Premise)

Este es el método estándar recomendado para servidores empresariales internos o en la nube (AWS EC2, DigitalOcean, Azure VM, servidor local institucional).

#### Paso 1: Clonación y Construcción del Frontend
```bash
cd /var/www/caja-chica
git pull origin main
npm install --production=false
npm run build
```
*Esto generará la carpeta optimizada y minificada `/dist`.*

#### Paso 2: Ejecución del Servicio Node.js con PM2
Se recomienda utilizar el gestor de procesos **PM2** para asegurar auto-reinicio, logs y tolerancia a fallos:

```bash
# Instalar PM2 globalmente si no se tiene
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name "caja-chica-api" --env production

# Configurar reinicio automático ante reinicio del servidor físico/VPS
pm2 startup
pm2 save
```

#### Paso 3: Configuración del Proxy Inverso Nginx con SSL
Cree el archivo de configuración en `/etc/nginx/sites-available/caja-chica.conf`:

```nginx
server {
    listen 80;
    server_name cajachica.miempresa.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cajachica.miempresa.com;

    ssl_certificate /etc/letsencrypt/live/cajachica.miempresa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cajachica.miempresa.com/privkey.pem;

    # Compresión Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Límite de subida de archivos (vouchers y comprobantes)
    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilite el sitio y reinicie Nginx:
```bash
ln -s /etc/nginx/sites-available/caja-chica.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 6.3 Despliegue Serverless / Cloud

Si TI prefiere un despliegue en plataformas como **Vercel** o **Render**:
1. Conectar el repositorio en el panel de Vercel.
2. Definir en las opciones de proyecto las Variables de Entorno del paso 5.
3. El archivo [vercel.json](file:///d:/PROYECTOS/CAJA_CHICA/vercel.json) redirige automáticamente las rutas SPA (`/*`) hacia `index.html`.
4. El backend en `server.js` puede alojarse como Web Service en Render / Railway / Cloud Run.

---

## 7. Base de Datos y Persistencia (Supabase / PostgreSQL)

El sistema utiliza PostgreSQL 15+. Toda la definición de tablas, relaciones, políticas y triggers se encuentra centralizada en:
📁 [supabase/schema.sql](file:///d:/PROYECTOS/CAJA_CHICA/supabase/schema.sql)

### Instrucciones de Ejecución para el Administrador de BBDD:
1. Acceda al **SQL Editor** del proyecto de Supabase (o cliente `psql`).
2. Ejecute el script completo [schema.sql](file:///d:/PROYECTOS/CAJA_CHICA/supabase/schema.sql).
3. Verifique que las siguientes 6 tablas queden creadas correctamente:

| Tabla | Propósito |
| :--- | :--- |
| `public.usuarios` | Maestro de colaboradores por DNI y asignación de múltiples roles. |
| `public.caja_fondos` | Control del fondo asignado, saldo disponible y estado de la caja. |
| `public.solicitudes` | Registro de solicitudes de adelanto, rendición de gastos, comprobantes y aprobaciones. |
| `public.notificaciones` | Registro y distribución de notificaciones a usuarios en tiempo real. |
| `public.categorias_gastos`| Maestro de categorías parametrizadas y centros de costo. |
| `public.auditoria_logs` | Registro cronológico inmutable de operaciones críticas. |

### Activación de WebSockets (Realtime)
El script incluye la publicación automática:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios;
```
> Asegúrese de que en el dashboard de Supabase: **Database -> Replication** estén marcadas como activas las tablas mencionadas.

---

## 8. Integraciones Externas y Servicios de Terceros

### 1. OneSignal (Web Push Notifications)
- **Función:** Notificar al solicitante cuando su requerimiento fue aprobado/rechazado, y alertar al Administrador ante nuevos registros.
- **Configuración:**
  1. Crear una Web App en [OneSignal Console](https://onesignal.com).
  2. Colocar en la raíz de `public/` el archivo de integración `OneSignalSDKWorker.js` si se requiere personalización nativa.
  3. Cargar el App ID en `VITE_ONESIGNAL_APP_ID`.

### 2. Factiliza API (Consulta SUNAT)
- **Función:** Al digitar un RUC en la rendición de gastos, el sistema consulta en tiempo real la Razón Social y estado del contribuyente en SUNAT para prevenir comprobantes de proveedores no habidos.
- **Servicio:** Implementado en [factilizaService.js](file:///d:/PROYECTOS/CAJA_CHICA/src/lib/factilizaService.js).
- **Configuración:** Token configurable en `VITE_FACTILIZA_TOKEN`. Si no se dispone de token activo, el sistema permite ingreso manual de la Razón Social sin bloquear la operativa.

### 3. Generación de Reportes Oficiales en Excel y Archivos ZIP
- **Librería Excel:** SheetJS (`xlsx`) con estructura de 4 hojas oficiales (Libro Caja Chica formateado para liquidación, Balance por Categoría, Resumen por Solicitante y Arqueo).
- **Librería ZIP:** JSZip para empaquetado masivo de vouchers y sustentos tributarios con nombres estandarizados por código de solicitud.

---

## 9. Seguridad, Autenticación y Matriz de Roles

### Mecanismo de Autenticación
- El acceso está diseñado para entornos corporativos internos mediante **DNI del colaborador**.
- No requiere contraseñas complejas que ralenticen la rendición en campo; la validación se cruza contra el **Maestro de Usuarios (`public.usuarios`)**.
- Los colaboradores pueden tener **múltiples roles simultáneos** (ejemplo: Administrador que también rinde gastos).

### Matriz de Acceso por Rol

| Módulo / Privilegio | SYSADMIN | ADMINISTRADOR | SOLICITANTE | USUARIO (Lector) |
| :--- | :---: | :---: | :---: | :---: |
| **Ingreso a la PWA por DNI** | ✅ | ✅ | ✅ | ✅ |
| **Registrar Adelanto / Rendición de Gastos** | ⚙️* | ⚙️* | ✅ | ❌ |
| **Consultar "Mis Solicitudes" y Rendir Adelantos** | ⚙️* | ⚙️* | ✅ | ❌ |
| **Bandeja de Aprobación y Rechazo de Gastos** | ❌ | ✅ | ❌ | ❌ |
| **Registro de Abono de Dinero y Comprobante** | ❌ | ✅ | ❌ | ❌ |
| **Visualizar Tablero de Arqueo y Saldo** | ✅ | ✅ | ❌ | ✅ |
| **Apertura, Cierre y Reposición de Fondo de Caja** | ✅ | ✅ | ❌ | ❌ |
| **Maestro de DNI (Crear/Editar Personal y Roles)** | ✅ | ❌ | ❌ | ❌ |
| **Maestro de Categorías y Centros de Costo** | ✅ | ✅ | ❌ | ❌ |
| **Generar y Descargar Reportes Excel / ZIP** | ✅ | ✅ | ❌ | ✅ |
| **Emisión de Liquidación Contable Oficial** | ✅ | ✅ | ❌ | ❌ |

*\* Si el usuario tiene asignados roles combinados (ej. `ADMINISTRADOR` + `SOLICITANTE`), dispondrá de ambos privilegios.*

---

## 10. Catálogo de Endpoints API REST

El servidor Express (`server.js`) expone los siguientes endpoints:

### 1. `GET /api/health`
- **Descripción:** Monitoreo de salud del servicio (Health Check para balanceadores o monitores de uptime).
- **Respuesta (JSON):**
```json
{
  "status": "online",
  "system": "Caja Chica PWA Engine",
  "timestamp": "2026-10-10T15:30:00.000Z",
  "supabaseConfigured": true
}
```

### 2. `POST /api/export-excel`
- **Descripción:** Generación en servidor y descarga binaria de hoja de cálculo Excel (`.xlsx`) consolidada.
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "items": [ /* Arreglo de solicitudes con comprobantes */ ],
  "title": "Liquidación Caja Chica Octubre 2026",
  "empresa": "EMPRESA S.A.C."
}
```
- **Respuesta:** Stream binario con cabecera `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## 11. Mecanismos de Resiliencia y Modo Offline

La aplicación cuenta con una arquitectura de alta disponibilidad implementada en [store.js](file:///d:/PROYECTOS/CAJA_CHICA/src/lib/store.js):

1. **Prioridad Supabase:** Si las credenciales están configuradas y hay conectividad, opera en la nube con WebSockets.
2. **Fallback Reactivo Local:** Si la conexión a Supabase no está disponible, el sistema conmuta automáticamente a **LocalStorage estructurado**.
3. **Sincronización Multi-Pestaña:** Emplea la API nativa del navegador `BroadcastChannel` para propagar cambios de solicitudes y aprobaciones entre pestañas y ventanas sin refrescar la página.
4. **PWA Offline Caching:** El Service Worker (`sw.js`) cachea los recursos estáticos esenciales para permitir que la aplicación abra y permita consultar información incluso en zonas sin cobertura de red.

---

## 12. Mantenimiento, Respaldo y Monitoreo

### Backups de la Base de Datos
- Si se usa **Supabase Cloud**, activar los backups automáticos diarios en el panel (*Database -> Backups*).
- Si se usa **PostgreSQL On-Premise**, configurar una tarea `cron` diaria:
```bash
0 2 * * * pg_dump -U postgres -d cajachica_db | gzip > /var/backups/cajachica_$(date +\%F).sql.gz
```

### Logs de la Aplicación
- Con PM2:
```bash
pm2 logs caja-chica-api --lines 200
```
- Archivos de log en disco: `~/.pm2/logs/caja-chica-api-out.log` y `~/.pm2/logs/caja-chica-api-error.log`.

---

## 13. Checklist de Recepción y Pase a Producción para TI

Marque cada casilla para validar la recepción conforme de la plataforma:

- [ ] **Código Fuente:** Repositorio descargado y verificado en la rama de producción (`main`).
- [ ] **Dependencias:** Ejecutado `npm install` sin errores de vulnerabilidades críticas.
- [ ] **Base de Datos:** Script [supabase/schema.sql](file:///d:/PROYECTOS/CAJA_CHICA/supabase/schema.sql) ejecutado en la instancia de PostgreSQL / Supabase.
- [ ] **Realtime:** Suscripción WebSockets confirmada en la tabla `solicitudes`.
- [ ] **Variables de Entorno:** Archivo `.env` configurado con URL y Anon Key válidas de Supabase.
- [ ] **Servidor Web / Proxy:** Dominio o subdominio asignado con certificado SSL activo (HTTPS).
- [ ] **Servicio de Fondo:** Node.js / Express ejecutándose bajo PM2 o Docker con política de reinicio `always`.
- [ ] **Prueba de Salud:** Endpoint `/api/health` respondiendo `{"status": "online"}`.
- [ ] **Prueba de PWA:** Aplicación permite instalación en Google Chrome / Edge / Android.
- [ ] **Prueba de Exportación:** Descarga de Excel y empaquetado ZIP funcionando desde el módulo de reportes.
- [ ] **Capacitación:** Entrega y lectura del [MANUAL_DE_USUARIO_Y_FLUJO.md](file:///d:/PROYECTOS/CAJA_CHICA/MANUAL_DE_USUARIO_Y_FLUJO.md) al área contable y administrativa.

---

## 14. Usuarios y Credenciales Semilla para QA

Para las pruebas técnicas de aceptación inicial de TI, se dispone de las siguientes identidades pre-cargadas en el seed:

| DNI | Nombre del Colaborador | Roles Asignados | Propósito de Prueba de TI |
| :--- | :--- | :--- | :--- |
| `10203040` | Carlos Alberto Méndez | `SYSADMIN`, `ADMINISTRADOR` | Configuración del sistema, alta de usuarios y aprobación. |
| `45678901` | Ana María Torres | `ADMINISTRADOR` | Aprobación de gastos, abono de caja y liquidaciones. |
| `78901234` | Javier Alonso Morales | `SOLICITANTE` | Registro de rendiciones y adelantos estándar. |
| `11223344` | Lucía Fernanda Vargas | `SOLICITANTE`, `USUARIO` | Solicitante con acceso a tablero de arqueo informativo. |
| `99887766` | Roberto Andrés Campos | `USUARIO` | Rol de solo lectura para auditoría o visualización. |
| `00112233` | Diana Sofía Castro | `SYSADMIN`, `ADMINISTRADOR`, `SOLICITANTE`, `USUARIO` | Perfil Superusuario con acceso a todas las pantallas. |

---

### Contacto y Soporte Técnico
Para consultas sobre el código o ampliación de módulos, referirse a la documentación interna de desarrollo o coordinar con el responsable del pase a producción.
