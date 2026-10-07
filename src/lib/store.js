import { createClient } from '@supabase/supabase-js';

// Intentar leer configuración de Supabase desde env o localStorage
const savedSupabaseUrl = typeof window !== 'undefined' ? localStorage.getItem('caja_supabase_url') : '';
const savedSupabaseKey = typeof window !== 'undefined' ? localStorage.getItem('caja_supabase_key') : '';

const SUPABASE_URL = savedSupabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = savedSupabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

export let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Error inicializando Supabase Client:', err);
  }
}

// Datos semilla de usuarios por defecto (con todas las combinaciones de roles solicitadas)
export const DEFAULT_USUARIOS = [
  {
    id: 'usr-1',
    dni: '10203040',
    nombres: 'Carlos Alberto',
    apellidos: 'Méndez Ríos',
    correo: 'carlos.mendez@empresa.com',
    telefono: '987654321',
    roles: ['SYSADMIN', 'ADMINISTRADOR'],
    activo: true,
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'usr-2',
    dni: '45678901',
    nombres: 'Ana María',
    apellidos: 'Torres Delgado',
    correo: 'ana.torres@empresa.com',
    telefono: '976543210',
    roles: ['ADMINISTRADOR'],
    activo: true,
    created_at: '2026-01-12T11:00:00Z'
  },
  {
    id: 'usr-3',
    dni: '78901234',
    nombres: 'Javier Alonso',
    apellidos: 'Morales Silva',
    correo: 'javier.morales@empresa.com',
    telefono: '965432109',
    roles: ['SOLICITANTE'],
    activo: true,
    created_at: '2026-01-15T09:30:00Z'
  },
  {
    id: 'usr-4',
    dni: '11223344',
    nombres: 'Lucía Fernanda',
    apellidos: 'Vargas Paredes',
    correo: 'lucia.vargas@empresa.com',
    telefono: '954321098',
    roles: ['SOLICITANTE', 'USUARIO'],
    activo: true,
    created_at: '2026-01-18T14:20:00Z'
  },
  {
    id: 'usr-5',
    dni: '99887766',
    nombres: 'Roberto Andrés',
    apellidos: 'Campos Núñez',
    correo: 'roberto.campos@empresa.com',
    telefono: '943210987',
    roles: ['USUARIO'],
    activo: true,
    created_at: '2026-01-20T16:00:00Z'
  },
  {
    id: 'usr-6',
    dni: '00112233',
    nombres: 'Diana Sofía',
    apellidos: 'Castro Miranda',
    correo: 'diana.castro@empresa.com',
    telefono: '932109876',
    roles: ['SYSADMIN', 'ADMINISTRADOR', 'SOLICITANTE', 'USUARIO'],
    activo: true,
    created_at: '2026-01-05T08:00:00Z'
  }
];

export const DEFAULT_SOLICITUDES = [
  {
    id: 'sol-001',
    codigo: 'SOL-2026-001',
    tipo: 'RENDICION_GASTO',
    solicitante_dni: '78901234',
    solicitante_nombre: 'Javier Alonso Morales Silva',
    monto: 125.50,
    moneda: 'PEN',
    motivo: 'Traslado en taxi para entrega y firma de escrituras notariales en Notaría Tambini',
    categoria: 'TRANSPORTE',
    comprobante_tipo: 'FACTURA',
    comprobante_numero: 'F001-0004523',
    comprobante_ruc_emisor: '20556789123',
    comprobante_razon_social: 'TAXI SEGURO METROPOLITANO S.A.C.',
    comprobante_fecha: '2026-10-05',
    comprobante_archivo_url: '',
    estado: 'PENDIENTE',
    aprobado_por_dni: null,
    aprobado_por_nombre: null,
    aprobado_fecha: null,
    observaciones_aprobador: null,
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString()
  },
  {
    id: 'sol-002',
    codigo: 'SOL-2026-002',
    tipo: 'ADELANTO_DINERO',
    solicitante_dni: '11223344',
    solicitante_nombre: 'Lucía Fernanda Vargas Paredes',
    monto: 250.00,
    moneda: 'PEN',
    motivo: 'Fondo adelantado para compra urgente de refrigerios y coffee break para visita de clientes clave',
    categoria: 'ALIMENTACION',
    comprobante_tipo: 'DECLARACION_JURADA',
    comprobante_numero: '',
    comprobante_ruc_emisor: '',
    comprobante_razon_social: '',
    comprobante_fecha: '2026-10-06',
    comprobante_archivo_url: '',
    estado: 'PENDIENTE',
    aprobado_por_dni: null,
    aprobado_por_nombre: null,
    aprobado_fecha: null,
    observaciones_aprobador: null,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'sol-003',
    codigo: 'SOL-2026-003',
    tipo: 'RENDICION_GASTO',
    solicitante_dni: '78901234',
    solicitante_nombre: 'Javier Alonso Morales Silva',
    monto: 85.00,
    moneda: 'PEN',
    motivo: 'Compra de 2 millares de papel bond A4 y 10 archivadores palanca para auditoría',
    categoria: 'MATERIALES_OFICINA',
    comprobante_tipo: 'BOLETA',
    comprobante_numero: 'B002-0012894',
    comprobante_ruc_emisor: '20100458921',
    comprobante_razon_social: 'LIBRERIA CONTINENTAL S.A.C.',
    comprobante_fecha: '2026-10-03',
    comprobante_archivo_url: '',
    estado: 'APROBADO',
    aprobado_por_dni: '45678901',
    aprobado_por_nombre: 'Ana María Torres Delgado',
    aprobado_fecha: new Date(Date.now() - 86400000).toISOString(),
    observaciones_aprobador: 'Conforme con comprobante físico verificado.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export const DEFAULT_CAJA_FONDO = {
  id: 'fondo-principal',
  nombre: 'Caja Chica Sede Central 2026',
  monto_total: 5000.00,
  monto_disponible: 4539.50,
  estado: 'ABIERTA',
  responsable_dni: '45678901'
};

// Canal Broadcast para sincronización cross-tab instantánea en caso de modo local
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('caja_chica_realtime_channel')
  : null;

// Gestor de Estado Local / Reactivo
class DataStore {
  constructor() {
    this.listeners = new Set();
    this.usuarios = this.loadInitial('caja_usuarios', DEFAULT_USUARIOS);
    this.solicitudes = this.loadInitial('caja_solicitudes', DEFAULT_SOLICITUDES);
    this.cajaFondo = this.loadInitial('caja_fondo', DEFAULT_CAJA_FONDO);
    this.notificaciones = this.loadInitial('caja_notificaciones', [
      {
        id: 'notif-1',
        titulo: 'Sistema Inicializado',
        mensaje: 'Bienvenido al sistema PWA de Caja Chica en tiempo real.',
        tipo: 'INFO',
        created_at: new Date().toISOString(),
        leido: false,
        usuario_dni: 'TODOS'
      }
    ]);

    if (broadcast) {
      broadcast.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ALL') {
          this.usuarios = this.loadInitial('caja_usuarios', DEFAULT_USUARIOS);
          this.solicitudes = this.loadInitial('caja_solicitudes', DEFAULT_SOLICITUDES);
          this.cajaFondo = this.loadInitial('caja_fondo', DEFAULT_CAJA_FONDO);
          this.notificaciones = this.loadInitial('caja_notificaciones', []);
          this.notifyListeners({ source: 'broadcast', event: event.data });
        }
      };
    }

    // Inicializar listener de Supabase Realtime si está configurado
    if (supabase) {
      this.initSupabaseRealtime();
    }
  }

  async sendOneSignalPush(title, message, targetDnis = null) {
    try {
      const body = {
        app_id: 'c50fba12-7b4e-45e9-8bc5-63d9639a2b53',
        headings: { en: title, es: title },
        contents: { en: message, es: message },
        target_channel: 'push',
      };
      
      if (targetDnis && targetDnis.length > 0) {
        body.include_aliases = { external_id: targetDnis };
      } else {
        body.included_segments = ["Total Subscriptions"];
      }

      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`
        },
        body: JSON.stringify(body)
      });
    } catch (e) {
      console.warn("OneSignal push error:", e);
    }
  }

  loadInitial(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  persist(key, data) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  notifyListeners(meta = {}) {
    this.listeners.forEach((listener) => {
      try {
        listener(meta);
      } catch (err) {
        console.error('Error en listener:', err);
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  broadcastSync(meta) {
    if (broadcast) {
      broadcast.postMessage({ type: 'SYNC_ALL', meta });
    }
    this.notifyListeners(meta);
  }

  async initSupabaseRealtime() {
    try {
      // Suscribirse a cambios en tablas
      supabase
        .channel('realtime-solicitudes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, (payload) => {
          this.handleSupabaseSolicitudEvent(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload) => {
          this.handleSupabaseUsuarioEvent(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'caja_fondo' }, (payload) => {
          this.handleSupabaseCajaFondoEvent(payload);
        })
        .subscribe();
    } catch (e) {
      console.warn('Error suscribiendo a Supabase Realtime:', e);
    }
  }

  handleSupabaseCajaFondoEvent(payload) {
    const { eventType, new: newRec } = payload;
    if (eventType === 'UPDATE' || eventType === 'INSERT') {
      this.cajaFondo = newRec;
      this.persist('caja_fondo', this.cajaFondo);
      this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'caja_fondo', eventType });
    }
  }

  handleSupabaseSolicitudEvent(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      this.solicitudes = [newRec, ...this.solicitudes.filter(s => s.id !== newRec.id)];
    } else if (eventType === 'UPDATE') {
      this.solicitudes = this.solicitudes.map(s => s.id === newRec.id ? newRec : s);
    } else if (eventType === 'DELETE') {
      this.solicitudes = this.solicitudes.filter(s => s.id !== oldRec.id);
    }
    this.persist('caja_solicitudes', this.solicitudes);
    this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'solicitudes', eventType, record: newRec });
  }

  handleSupabaseUsuarioEvent(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      this.usuarios = this.usuarios.map(u => u.dni === newRec.dni ? newRec : u);
      if (!this.usuarios.find(u => u.dni === newRec.dni)) {
        this.usuarios.push(newRec);
      }
    } else if (eventType === 'DELETE') {
      this.usuarios = this.usuarios.filter(u => u.dni !== oldRec.dni);
    }
    this.persist('caja_usuarios', this.usuarios);
    this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'usuarios', eventType });
  }

  // --- MÉTODOS DE USUARIOS / MAESTRO DNI ---
  async getCajaFondo() {
    if (supabase) {
      const { data, error } = await supabase.from('caja_fondo').select('*').limit(1).single();
      if (!error && data) {
        this.cajaFondo = data;
        this.persist('caja_fondo', data);
        this.notifyListeners({ type: 'DATA_LOADED' });
        return data;
      }
    }
    return this.cajaFondo;
  }

  async getUsuarios() {
    if (supabase) {
      const { data, error } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        this.usuarios = data;
        this.persist('caja_usuarios', data);
        this.notifyListeners({ type: 'DATA_LOADED' });
        return data;
      }
    }
    return this.usuarios;
  }

  async saveUsuario(userData) {
    const existingIdx = this.usuarios.findIndex(u => u.dni === userData.dni);
    let updated;
    if (existingIdx >= 0) {
      updated = { ...this.usuarios[existingIdx], ...userData, updated_at: new Date().toISOString() };
      this.usuarios[existingIdx] = updated;
    } else {
      updated = {
        id: 'usr-' + Date.now(),
        ...userData,
        activo: userData.activo !== undefined ? userData.activo : true,
        created_at: new Date().toISOString()
      };
      this.usuarios.unshift(updated);
    }

    this.persist('caja_usuarios', this.usuarios);

    if (supabase) {
      await supabase.from('usuarios').upsert(updated, { onConflict: 'dni' });
    }

    this.broadcastSync({ type: 'USUARIO_SAVED', usuario: updated });
    return updated;
  }

  async toggleUsuarioActivo(dni) {
    const user = this.usuarios.find(u => u.dni === dni);
    if (!user) return null;
    user.activo = !user.activo;
    this.persist('caja_usuarios', this.usuarios);

    if (supabase) {
      await supabase.from('usuarios').update({ activo: user.activo }).eq('dni', dni);
    }

    this.broadcastSync({ type: 'USUARIO_UPDATED', usuario: user });
    return user;
  }

  // --- MÉTODOS DE SOLICITUDES Y CAJA CHICA ---
  async getSolicitudes() {
    if (supabase) {
      const { data, error } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.solicitudes = data;
        this.persist('caja_solicitudes', data);
        this.notifyListeners({ type: 'DATA_LOADED' });
        return data;
      }
    }
    return this.solicitudes;
  }

  async createSolicitud(solData) {
    const correlativo = String(this.solicitudes.length + 1).padStart(3, '0');
    const codigo = `SOL-2026-${correlativo}`;
    const newSolicitud = {
      id: 'sol-' + Date.now(),
      codigo,
      moneda: 'PEN',
      estado: 'PENDIENTE',
      created_at: new Date().toISOString(),
      ...solData
    };

    this.solicitudes.unshift(newSolicitud);
    this.persist('caja_solicitudes', this.solicitudes);

    // Crear notificación para administradores
    this.addNotification({
      titulo: 'Nueva Solicitud Registrada',
      mensaje: `${solData.solicitante_nombre} ha registrado la solicitud ${codigo} por S/ ${Number(solData.monto).toFixed(2)}.`,
      tipo: 'WARNING',
      usuario_dni: 'ADMINS',
      referencia_id: newSolicitud.id
    });

    if (supabase) {
      try {
        await supabase.from('solicitudes').insert(newSolicitud);
      } catch (e) {
        console.warn('Error guardando solicitud en Supabase:', e);
      }
    }

    // Enviar notificación Push (OneSignal) a Administradores y Cajeros (USUARIO)
    const adminYCajerosDnis = this.usuarios.filter(u => u.roles?.includes('ADMINISTRADOR') || u.roles?.includes('USUARIO')).map(u => u.dni);
    this.sendOneSignalPush('Nueva Solicitud Registrada', `${solData.solicitante_nombre} ha registrado un gasto por S/ ${Number(solData.monto).toFixed(2)}.`, adminYCajerosDnis);

    this.broadcastSync({ type: 'SOLICITUD_CREATED', solicitud: newSolicitud });
    return newSolicitud;
  }

  async updateEstadoSolicitud(id, nuevoEstado, adminUser, observaciones = '') {
    const sol = this.solicitudes.find(s => s.id === id);
    if (!sol) throw new Error('Solicitud no encontrada');

    sol.estado = nuevoEstado;

    if (nuevoEstado === 'APROBADO' || nuevoEstado === 'RECHAZADO') {
      sol.aprobado_por_dni = adminUser.dni;
      sol.aprobado_por_nombre = `${adminUser.nombres} ${adminUser.apellidos}`;
      sol.aprobado_fecha = new Date().toISOString();
      sol.observaciones_aprobador = observaciones;
    }

    // Si el Cajero/Usuario abona el dinero, descontar del fondo disponible
    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      const monto = Number(sol.monto || 0);
      this.cajaFondo.monto_disponible = Math.max(0, this.cajaFondo.monto_disponible - monto);
      this.persist('caja_fondo', this.cajaFondo);
      
      sol.pagado_por_dni = adminUser.dni;
      sol.pagado_por_nombre = `${adminUser.nombres} ${adminUser.apellidos}`;
      sol.pagado_fecha = new Date().toISOString();

      if (supabase) {
        try {
          await supabase.from('caja_fondo').update({ monto_disponible: this.cajaFondo.monto_disponible }).eq('id', this.cajaFondo.id);
        } catch (e) {
          console.warn('Error actualizando fondo en Supabase:', e);
        }
      }
    }

    this.persist('caja_solicitudes', this.solicitudes);

    // Notificación al solicitante específico
    let statusText = nuevoEstado;
    let title = `Solicitud ${statusText}: ${sol.codigo}`;
    let msg = `Tu solicitud por S/ ${Number(sol.monto).toFixed(2)} fue ${statusText.toLowerCase()} por ${adminUser.nombres}. ${observaciones ? 'Obs: ' + observaciones : ''}`;
    
    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      msg = `Tu solicitud ${sol.codigo} por S/ ${Number(sol.monto).toFixed(2)} ha sido ABONADA/PAGADA por caja (${adminUser.nombres}). El dinero ya ha sido entregado.`;
    }

    this.addNotification({
      titulo: title,
      mensaje: msg,
      tipo: nuevoEstado === 'APROBADO' || nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR' || nuevoEstado === 'RENDIDO' ? 'SUCCESS' : 'DANGER',
      usuario_dni: sol.solicitante_dni,
      referencia_id: sol.id
    });

    if (supabase) {
      try {
        await supabase.from('solicitudes').update({
          estado: sol.estado,
          aprobado_por_dni: sol.aprobado_por_dni,
          aprobado_por_nombre: sol.aprobado_por_nombre,
          aprobado_fecha: sol.aprobado_fecha,
          observaciones_aprobador: sol.observaciones_aprobador,
          pagado_por_dni: sol.pagado_por_dni,
          pagado_por_nombre: sol.pagado_por_nombre,
          pagado_fecha: sol.pagado_fecha
        }).eq('id', id);
      } catch (e) {
        console.warn('Error actualizando en Supabase:', e);
      }
    }

    // Enviar notificación Push (OneSignal) al Solicitante (y al Cajero si es aprobado)
    let msgPush = '';
    let targetPushDnis = [sol.solicitante_dni];

    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      msgPush = `${adminUser.nombres} entregó el efectivo de tu ${sol.operacion}.`;
    } else if (nuevoEstado === 'APROBADO') {
      msgPush = `${adminUser.nombres} aprobó el ${sol.operacion} de ${sol.solicitante_nombre}. Cajero, proceda con el abono.`;
      const cajerosDnis = this.usuarios.filter(u => u.roles?.includes('USUARIO')).map(u => u.dni);
      targetPushDnis = [...targetPushDnis, ...cajerosDnis];
    } else {
      msgPush = `Tu ${sol.operacion} fue ${nuevoEstado.toLowerCase()} por ${adminUser.nombres}.`;
    }

    this.sendOneSignalPush(`Caja Chica: ${sol.codigo}`, msgPush, targetPushDnis);

    this.broadcastSync({ type: 'SOLICITUD_STATUS_CHANGED', solicitud: sol, estado: nuevoEstado });
    return sol;
  }

  async rendirAdelanto(id, comprobantesArray) {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({ 
          rendiciones: JSON.stringify(comprobantesArray),
          estado: 'RENDIDO'
        })
        .eq('id', id)
        .select();
      if (error) throw error;
      const idx = this.solicitudes.findIndex(s => s.id === id);
      if (idx !== -1 && data && data.length > 0) {
        this.solicitudes[idx] = data[0];
      }
      this.broadcastSync({ type: 'SOLICITUD_RENDIDA', id });
      return data[0];
    } else {
      // Fallback local
      const idx = this.solicitudes.findIndex(s => s.id === id);
      if (idx === -1) throw new Error("Solicitud no encontrada");
      this.solicitudes[idx].rendiciones = JSON.stringify(comprobantesArray);
      this.solicitudes[idx].estado = 'RENDIDO';
      this.persist('solicitudes', this.solicitudes);
      this.broadcastSync({ type: 'SOLICITUD_RENDIDA', id });
      return this.solicitudes[idx];
    }
  }

  // --- ASIGNACIÓN DE FONDOS (ADMIN) ---
  async updateFondoAsignado(nuevoMonto) {
    // Calculamos el monto gastado histórico o recalculamos en base a la diferencia
    const gastado = this.cajaFondo.monto_total - this.cajaFondo.monto_disponible;
    this.cajaFondo.monto_total = Number(nuevoMonto);
    this.cajaFondo.monto_disponible = Math.max(0, this.cajaFondo.monto_total - gastado);
    this.persist('caja_fondo', this.cajaFondo);
    
    if (supabase) {
      try {
        await supabase.from('caja_fondo').update({
          monto_total: this.cajaFondo.monto_total,
          monto_disponible: this.cajaFondo.monto_disponible
        }).eq('id', this.cajaFondo.id);
      } catch (e) {
        console.warn('Error actualizando tope de fondo en Supabase:', e);
      }
    }

    this.broadcastSync({ type: 'FONDO_UPDATED', fondo: this.cajaFondo });
    return this.cajaFondo;
  }

  // --- NOTIFICACIONES ---
  addNotification(notifData) {
    const notif = {
      id: 'notif-' + Date.now(),
      created_at: new Date().toISOString(),
      leido: false,
      ...notifData
    };
    this.notificaciones.unshift(notif);
    if (this.notificaciones.length > 50) this.notificaciones.pop();
    this.persist('caja_notificaciones', this.notificaciones);

    return notif;
  }

  marcarNotificacionesLeidas() {
    this.notificaciones.forEach(n => n.leido = true);
    this.persist('caja_notificaciones', this.notificaciones);
    this.broadcastSync({ type: 'NOTIFICATIONS_READ' });
  }
}

export const store = new DataStore();
