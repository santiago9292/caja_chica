# 💼 Caja Chica Empresarial - Progressive Web App (PWA)

Sistema corporativo en tiempo real para la gestión, rendición de gastos, anticipos de efectivo y control de arqueos de **Caja Chica**, desarrollado con arquitectura reactiva, soporte de **Supabase Realtime**, PWA instalable en móviles y desktop, control de acceso multi-nivel por **DNI y Roles Múltiples**, y generación de reportes en **Excel (.xlsx)**.

> 📖 **Manual de Usuario y Flujo Operativo**: Puedes consultar el manual completo y detallado paso a paso en [MANUAL_DE_USUARIO_Y_FLUJO.md](./MANUAL_DE_USUARIO_Y_FLUJO.md).

---

## 🚀 Características Principales

- **📱 PWA Instalable y Offline-Ready**:
  - Web App Manifest configurado con display standalone, diseño adaptable para smartphones, tablets y escritorio.
  - Service Worker (`sw.js`) con soporte de caché y Push Notifications.
- **⚡ Tiempo Real & Notificaciones en Vivo**:
  - Integración nativa con **Supabase Realtime** (`postgres_changes`) y fallback automático reactivo multi-pestaña mediante `BroadcastChannel`.
  - Notificaciones flotantes en vivo (Toasts) y alertas sonoras sintetizadas con **Web Audio API** (sin dependencias de archivos de audio externos).
  - Soporte para notificaciones nativas del sistema operativo / navegador.
- **🔐 Login Simple por DNI & Maestro de Personal con Roles Múltiples**:
  - Ingreso ágil digitando únicamente el DNI del colaborador.
  - Perfiles de demostración rápida para pruebas inmediatas de cada rol.
  - **Maestro de DNI (Exclusivo SYSADMIN)**: Creación y edición de colaboradores con asignación de **múltiples roles** por persona (`ADMINISTRADOR`, `SYSADMIN`, `SOLICITANTE`, `USUARIO`).
- **📝 Formulario de Ingreso de Datos (SOLICITANTE)**:
  - Registro de **Rendición de Gastos** (con comprobantes: Factura, Boleta, Recibo por Honorarios, Ticket, Planilla de Movilidad o Sin Comprobante) y **Adelantos de Efectivo**.
  - Categorización con iconos: Transporte, Alimentación, Materiales de Oficina, Servicios Urgentes, Gastos de Representación y Otros.
  - Adjunto y previsualización de sustento digital con soporte para fotos, PDF, Excel (.xlsx, .xls) y Word (.docx, .doc).
- **🛡️ Módulo de Aprobación (Exclusivo ADMINISTRADOR)**:
  - Vista restringida con verificación estricta de privilegios.
  - Bandeja interactiva de evaluación de solicitudes pendientes en tiempo real.
  - Vista detallada del sustento, RUC, emisor, montos y visor del voucher adjunto.
  - Acciones de **Aprobar** (descuenta del fondo, dispara confeti y notifica al solicitante) y **Rechazar** (con observación obligatoria y notificación inmediata).
- **📊 Arqueo y Control de Balance**:
  - Visualización del Fondo Fijo Asignado, Saldo Disponible en Caja, Gastos Egresados y En Trámite.
  - Gráfica de avance del presupuesto y desglose por categorías de gasto.
- **📑 Generación de Reportes Oficiales en Excel (.xlsx)**:
  - Exportación con la librería `xlsx` (SheetJS) con formato profesional estructurado en 4 pestañas:
    1. **Arqueo & Balance**: Resumen ejecutivo, fondos y fecha de corte.
    2. **Libro Caja Chica**: Listado exhaustivo de movimientos con datos de comprobantes y aprobadores.
    3. **Por Categoría**: Totales agrupados y conteo de comprobantes.
    4. **Por Solicitante**: Resumen de importes solicitados y aprobados por cada colaborador.
  - Filtros interactivos por rango de fechas, estados y categorías.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, Vite, Vanilla CSS con variables de diseño Dark/Glassmorphic, Lucide React Icons, Canvas Confetti.
- **Backend**: Node.js, Express 5, CORS, Dotenv, SheetJS (`xlsx`).
- **Base de Datos & Realtime**: PostgreSQL vía Supabase (con script SQL completo en `supabase/schema.sql`).
- **PWA**: Service Worker, Web App Manifest, Cache API, Web Audio API, Notification API.

---

## 👥 Matriz de Roles y Niveles de Acceso

| Módulo / Función | SYSADMIN | ADMINISTRADOR | SOLICITANTE | USUARIO |
| :--- | :---: | :---: | :---: | :---: |
| **Login por DNI** | ✅ | ✅ | ✅ | ✅ |
| **Ingreso de Solicitud / Rendición** | ⚙️* | ⚙️* | ✅ | ❌ |
| **Mis Solicitudes (Seguimiento)** | ⚙️* | ⚙️* | ✅ | ❌ |
| **Módulo de Aprobación (Exclusivo)** | ❌ | ✅ | ❌ | ❌ |
| **Arqueo & Balance de Caja** | ✅ | ✅ | ❌ | ✅ |
| **Maestro de DNIs & Roles Multi-nivel** | ✅ | ❌ | ❌ | ❌ |
| **Reportes & Exportación a Excel** | ✅ | ✅ | ❌ | ✅ |

*\* Nota: Si una persona tiene asignados múltiples roles (por ejemplo `[SYSADMIN, ADMINISTRADOR, SOLICITANTE]`), tendrá acceso combinado a todas las funciones correspondientes a cada uno de sus roles.*

---

## 📦 Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd CAJA_CHICA
npm install
```

### 2. Configurar Variables de Entorno (Opcional)
Crea un archivo `.env` basado en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
PORT=3001
```
*Si no configuras Supabase inicialmente, la aplicación arrancará en modo **Offline / Local Reactive Storage** con sincronización multi-pestaña automática y perfiles pre-cargados.*

### 3. Configurar Supabase (Opcional para nube)
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Abre el **SQL Editor** en tu dashboard de Supabase.
3. Copia y ejecuta todo el contenido de [`supabase/schema.sql`](supabase/schema.sql).
4. En la PWA, haz clic en el ícono de **Configuración (⚙️)** en la barra superior o ingresa las credenciales en tu `.env`.

### 4. Iniciar la Aplicación
Puedes iniciar el frontend y el backend simultáneamente:
```bash
npm start
```
O iniciar por separado:
```bash
# Terminal 1: Frontend Vite (PWA)
npm run dev

# Terminal 2: Servidor API Node.js
npm run server
```

- **Frontend PWA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

---

## 🧪 Usuarios Demo para Pruebas Inmediatas

| DNI | Nombre | Roles Asignados |
| :--- | :--- | :--- |
| **10203040** | Carlos Alberto Méndez | `SYSADMIN`, `ADMINISTRADOR` |
| **45678901** | Ana María Torres | `ADMINISTRADOR` |
| **78901234** | Javier Alonso Morales | `SOLICITANTE` |
| **11223344** | Lucía Fernanda Vargas | `SOLICITANTE`, `USUARIO` |
| **99887766** | Roberto Andrés Campos | `USUARIO` |
| **00112233** | Diana Sofía Castro | `SYSADMIN`, `ADMINISTRADOR`, `SOLICITANTE`, `USUARIO` (Todos) |
