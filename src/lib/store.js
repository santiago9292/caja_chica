import { createClient } from '@supabase/supabase-js';
import { buildNotifUrl } from './notifRouting';

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

// Usuarios registrados autorizados (sincronizados con base de datos de Supabase)
export const DEFAULT_USUARIOS = [
  {
    id: 'usr-1',
    dni: '00000000',
    nombres: 'PERCY',
    apellidos: '-',
    correo: 'percy@empresa.com',
    telefono: '',
    roles: ['SYSADMIN', 'ADMINISTRADOR'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-2',
    dni: '12345678',
    nombres: 'Claudia',
    apellidos: 'Cadillo',
    correo: 'claudia.cadillo@empresa.com',
    telefono: '',
    roles: ['ADMINISTRADOR'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-3',
    dni: '87654321',
    nombres: 'Jorge',
    apellidos: '-',
    correo: 'jorge@empresa.com',
    telefono: '',
    roles: ['SOLICITANTE'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-4',
    dni: '10203040',
    nombres: 'Maria',
    apellidos: '-',
    correo: 'maria@empresa.com',
    telefono: '',
    roles: ['SOLICITANTE', 'USUARIO'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-5',
    dni: '99887766',
    nombres: 'Andrea',
    apellidos: '-',
    correo: 'andrea@empresa.com',
    telefono: '',
    roles: ['USUARIO'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-6',
    dni: '47361788',
    nombres: 'Santiago',
    apellidos: 'Pazos',
    correo: 'santiago.pazos@empresa.com',
    telefono: '',
    roles: ['SYSADMIN', 'ADMINISTRADOR', 'SOLICITANTE', 'USUARIO'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-7',
    dni: '00000001',
    nombres: 'NATALI',
    apellidos: 'RAMOS',
    correo: '',
    telefono: '',
    roles: ['SOLICITANTE'],
    activo: true,
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const CENTROS_COSTO_LISTA = [
  'TRANS',
  'ALM 1',
  'ALM 2',
  'ALM 3',
  'ALM 4',
  'LAB',
  'REFRI'
];

export const CATEGORIAS_LISTA = [
  'ADMINISTRACIÓN',
  'VENTAS',
  'PRODUCCION'
];

export const DEFAULT_CATEGORIAS = [
  // TRANS
  { id: 'TRANS_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'TRANS', descripcion: 'Administración (TRANS)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'TRANS_VENTAS', nombre: 'VENTAS', centro_costo: 'TRANS', descripcion: 'Ventas (TRANS)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'TRANS_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'TRANS', descripcion: 'Producción (TRANS)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // ALM 1
  { id: 'ALM_1_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'ALM 1', descripcion: 'Administración (ALM 1)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_1_VENTAS', nombre: 'VENTAS', centro_costo: 'ALM 1', descripcion: 'Ventas (ALM 1)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_1_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'ALM 1', descripcion: 'Producción (ALM 1)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // ALM 2
  { id: 'ALM_2_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'ALM 2', descripcion: 'Administración (ALM 2)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_2_VENTAS', nombre: 'VENTAS', centro_costo: 'ALM 2', descripcion: 'Ventas (ALM 2)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_2_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'ALM 2', descripcion: 'Producción (ALM 2)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // ALM 3
  { id: 'ALM_3_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'ALM 3', descripcion: 'Administración (ALM 3)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_3_VENTAS', nombre: 'VENTAS', centro_costo: 'ALM 3', descripcion: 'Ventas (ALM 3)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_3_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'ALM 3', descripcion: 'Producción (ALM 3)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // ALM 4
  { id: 'ALM_4_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'ALM 4', descripcion: 'Administración (ALM 4)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_4_VENTAS', nombre: 'VENTAS', centro_costo: 'ALM 4', descripcion: 'Ventas (ALM 4)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'ALM_4_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'ALM 4', descripcion: 'Producción (ALM 4)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // LAB
  { id: 'LAB_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'LAB', descripcion: 'Administración (LAB)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'LAB_VENTAS', nombre: 'VENTAS', centro_costo: 'LAB', descripcion: 'Ventas (LAB)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'LAB_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'LAB', descripcion: 'Producción (LAB)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  
  // REFRI
  { id: 'REFRI_ADMINISTRACION', nombre: 'ADMINISTRACIÓN', centro_costo: 'REFRI', descripcion: 'Administración (REFRI)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'REFRI_VENTAS', nombre: 'VENTAS', centro_costo: 'REFRI', descripcion: 'Ventas (REFRI)', activo: true, created_at: '2026-10-07T00:00:00Z' },
  { id: 'REFRI_PRODUCCION', nombre: 'PRODUCCION', centro_costo: 'REFRI', descripcion: 'Producción (REFRI)', activo: true, created_at: '2026-10-07T00:00:00Z' },

  // Antiguos (inactivos para compatibilidad con registros existentes)
  { id: 'TRANSPORTE', nombre: 'Transporte / Movilidad', centro_costo: 'CC-OPERACIONES', descripcion: 'Pasajes, taxis, traslados, combustible', activo: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ALIMENTACION', nombre: 'Alimentación / Refrigerios', centro_costo: 'CC-ADMINISTRACION', descripcion: 'Almuerzos, refrigerios y consumos laborales autorizados', activo: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'MATERIALES_OFICINA', nombre: 'Materiales de Oficina', centro_costo: 'CC-ADMINISTRACION', descripcion: 'Papelería, útiles de escritorio y consumibles', activo: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'SERVICIOS_URGENTES', nombre: 'Servicios Urgentes', centro_costo: 'CC-MANTENIMIENTO', descripcion: 'Cerrajería, plomería, envíos express y reparaciones menores', activo: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'REPRESENTACION', nombre: 'Gastos de Representación', centro_costo: 'CC-GERENCIA', descripcion: 'Atención a clientes y gestiones institucionales', activo: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'OTROS', nombre: 'Otros Gastos Operativos', centro_costo: 'CC-GENERAL', descripcion: 'Gastos menores imprevistos debidamente sustentados', activo: false, created_at: '2026-01-01T00:00:00Z' }
];

export const DEFAULT_SOLICITUDES = [];

export const DEFAULT_CAJA_FONDO = {
  id: 'fondo-principal',
  nombre: 'CAJA CHICA DICAR LOGISTIC',
  monto_total: 500.00,
  monto_disponible: 500.00,
  estado: 'ABIERTA',
  responsable_dni: '47361788'
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
    this.categorias = this.loadInitial('caja_categorias', DEFAULT_CATEGORIAS);
    this.solicitudes = this.loadInitial('caja_solicitudes', DEFAULT_SOLICITUDES);
    this.cajaFondo = this.loadInitial('caja_fondo', DEFAULT_CAJA_FONDO);
    this.notificaciones = this.loadInitial('caja_notificaciones', []);

    if (broadcast) {
      broadcast.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ALL') {
          this.usuarios = this.loadInitial('caja_usuarios', DEFAULT_USUARIOS);
          this.categorias = this.loadInitial('caja_categorias', DEFAULT_CATEGORIAS);
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

  /**
   * @param {string} title
   * @param {string} message
   * @param {string[]|null} targetDnis
   * @param {{evento?: string, solicitanteDni?: string}} [nav] Destino al hacer clic en la notificación
   */
  async sendOneSignalPush(title, message, targetDnis = null, nav = {}) {
    try {
      const body = {
        app_id: 'c50fba12-7b4e-45e9-8bc5-63d9639a2b53',
        headings: { en: title, es: title },
        contents: { en: message, es: message },
        target_channel: 'push',
        priority: 10, // Alta prioridad: entrega inmediata aunque la pantalla esté apagada (Doze)
        ttl: 86400,   // Conservar 24h si el dispositivo está sin conexión
      };

      // URL de destino al hacer clic: cada dispositivo resuelve la pestaña según sus roles
      if (nav.evento) {
        body.web_url = buildNotifUrl(nav.evento, nav.solicitanteDni);
      }

      if (targetDnis && targetDnis.length > 0) {
        const strDnis = targetDnis.map(String);
        body.include_aliases = { external_id: strDnis }; // External ID (DNI) => todos los dispositivos del usuario
      } else {
        body.included_segments = ["Total Subscriptions"];
      }

      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}`
        },
        body: JSON.stringify(body)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.errors) {
        console.warn("OneSignal push respuesta:", res.status, result);
      }
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
    if (!supabase) return;
    try {
      if (this.realtimeChannel) {
        try { supabase.removeChannel(this.realtimeChannel); } catch (e) {}
      }
      // Suscribirse a cambios en tablas con reconexión automática
      this.realtimeChannel = supabase
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias_gastos' }, (payload) => {
          this.handleSupabaseCategoriaEvent(payload);
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime conectado');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ Supabase Realtime desconectado/error:', status, err);
            setTimeout(() => this.initSupabaseRealtime(), 3000);
          }
        });
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

  handleSupabaseCategoriaEvent(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      this.categorias = this.categorias.map(c => c.id === newRec.id ? newRec : c);
      if (!this.categorias.find(c => c.id === newRec.id)) {
        this.categorias.push(newRec);
      }
    } else if (eventType === 'DELETE') {
      this.categorias = this.categorias.filter(c => c.id !== oldRec.id);
    }
    this.persist('caja_categorias', this.categorias);
    this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'categorias_gastos', eventType });
  }

  handleSupabaseSolicitudEvent(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      this.solicitudes = [newRec, ...this.solicitudes.filter(s => s.id !== newRec.id)];
      this.persist('caja_solicitudes', this.solicitudes);

      // Registrar notificación en la lista de notificaciones local si no existe
      const notifExists = this.notificaciones.some(n => n.referencia_id === newRec.id);
      if (!notifExists) {
        this.addNotification({
          titulo: 'Nueva Solicitud Registrada',
          mensaje: `${newRec.solicitante_nombre} ha registrado la solicitud ${newRec.codigo} por S/ ${Number(newRec.monto || 0).toFixed(2)}.`,
          tipo: 'WARNING',
          usuario_dni: 'ADMINS',
          referencia_id: newRec.id
        });
      }

      // Notificar a la app para actualizar UI de aprobación, Toast, sonido y notificación nativa
      this.notifyListeners({ 
        type: 'SOLICITUD_CREATED', 
        solicitud: newRec,
        source: 'supabase_realtime'
      });
      return;
    } else if (eventType === 'UPDATE') {
      const prevSol = this.solicitudes.find(s => s.id === newRec.id);
      this.solicitudes = this.solicitudes.map(s => s.id === newRec.id ? newRec : s);
      this.persist('caja_solicitudes', this.solicitudes);

      if (prevSol && prevSol.estado !== newRec.estado) {
        this.notifyListeners({ 
          type: 'SOLICITUD_STATUS_CHANGED', 
          solicitud: newRec,
          estado: newRec.estado,
          source: 'supabase_realtime'
        });
      } else {
        this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'solicitudes', eventType, record: newRec });
      }
      return;
    } else if (eventType === 'DELETE') {
      this.solicitudes = this.solicitudes.filter(s => s.id !== oldRec.id);
      this.persist('caja_solicitudes', this.solicitudes);
      this.notifyListeners({ type: 'SUPABASE_REALTIME', table: 'solicitudes', eventType, record: oldRec });
    }
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

  // --- MÉTODOS DE CATEGORÍAS DE GASTOS ---
  async getCategorias() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('categorias_gastos')
          .select('*')
          .order('nombre', { ascending: true });
        if (!error && data && data.length > 0) {
          this.categorias = data;
          this.persist('caja_categorias', data);
          this.notifyListeners({ type: 'DATA_LOADED' });
          return data;
        } else if (!error && Array.isArray(data) && data.length === 0) {
          // Si la tabla fue creada en Supabase pero está vacía, sembrar automáticamente las categorías base
          try {
            await supabase.from('categorias_gastos').insert(DEFAULT_CATEGORIAS);
            this.categorias = DEFAULT_CATEGORIAS;
            this.persist('caja_categorias', DEFAULT_CATEGORIAS);
            this.notifyListeners({ type: 'DATA_LOADED' });
            return DEFAULT_CATEGORIAS;
          } catch (seedErr) {
            console.warn('Error auto-sembrando categorias_gastos:', seedErr);
          }
        }
      } catch (e) {
        console.warn('Tabla categorias_gastos no disponible en Supabase, usando local:', e);
      }
    }
    return this.categorias;
  }

  async saveCategoria(catData) {
    const existingIdx = this.categorias.findIndex(c => c.id === catData.id);
    let updated;
    const cCosto = (catData.centro_costo || 'CC-GENERAL').trim().toUpperCase();
    if (existingIdx >= 0) {
      updated = {
        ...this.categorias[existingIdx],
        ...catData,
        centro_costo: cCosto,
        updated_at: new Date().toISOString()
      };
      this.categorias[existingIdx] = updated;
    } else {
      const generatedId = (catData.id || catData.nombre.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')).trim();
      updated = {
        id: generatedId,
        nombre: catData.nombre.trim(),
        centro_costo: cCosto,
        descripcion: catData.descripcion || '',
        activo: catData.activo !== undefined ? catData.activo : true,
        created_at: new Date().toISOString()
      };
      this.categorias.push(updated);
    }
    this.persist('caja_categorias', this.categorias);

    if (supabase) {
      try {
        await supabase.from('categorias_gastos').upsert(updated);
      } catch (e) {
        console.warn('Error guardando categoría en Supabase:', e);
      }
    }

    this.broadcastSync({ type: 'CATEGORIA_UPDATED', categoria: updated });
    return updated;
  }

  async toggleCategoriaActiva(id) {
    const cat = this.categorias.find(c => c.id === id);
    if (!cat) return null;
    cat.activo = !cat.activo;
    this.persist('caja_categorias', this.categorias);

    if (supabase) {
      try {
        await supabase.from('categorias_gastos').update({ activo: cat.activo }).eq('id', id);
      } catch (e) {
        console.warn('Error actualizando estado de categoría en Supabase:', e);
      }
    }

    this.broadcastSync({ type: 'CATEGORIA_UPDATED', categoria: cat });
    return cat;
  }

  async deleteCategoria(id) {
    this.categorias = this.categorias.filter(c => c.id !== id);
    this.persist('caja_categorias', this.categorias);

    if (supabase) {
      try {
        await supabase.from('categorias_gastos').delete().eq('id', id);
      } catch (e) {
        console.warn('Error eliminando categoría en Supabase:', e);
      }
    }

    this.broadcastSync({ type: 'CATEGORIA_DELETED', id });
    return true;
  }

  // --- MÉTODOS DE FONDO / SALDO DE CAJA CHICA ---
  async syncCajaFondoToSupabase() {
    if (!supabase) return;
    try {
      await supabase.from('caja_fondo').upsert({
        id: this.cajaFondo.id || 'fondo-principal',
        nombre: this.cajaFondo.nombre || 'CAJA CHICA DICAR LOGISTIC',
        monto_total: Number(this.cajaFondo.monto_total || 500),
        monto_disponible: Number(this.cajaFondo.monto_disponible || 0),
        estado: this.cajaFondo.estado || 'ABIERTA',
        responsable_dni: this.cajaFondo.responsable_dni || '47361788'
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Error sincronizando caja_fondo a Supabase:', e);
    }
  }

  async getCajaFondo() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('caja_fondo').select('*').limit(1);
        if (!error && data && data.length > 0) {
          this.cajaFondo = data[0];
          this.persist('caja_fondo', this.cajaFondo);
          this.notifyListeners({ type: 'DATA_LOADED' });
          return this.cajaFondo;
        } else if (!error && Array.isArray(data) && data.length === 0) {
          // Si la tabla en Supabase está vacía (0 registros), sembrar automáticamente el fondo
          const fondoInicial = {
            id: 'fondo-principal',
            nombre: 'CAJA CHICA DICAR LOGISTIC',
            monto_total: Number(this.cajaFondo?.monto_total || 500),
            monto_disponible: Number(this.cajaFondo?.monto_disponible || 500),
            estado: 'ABIERTA',
            responsable_dni: this.cajaFondo?.responsable_dni || '47361788'
          };
          const { data: inserted, error: insertErr } = await supabase
            .from('caja_fondo')
            .upsert(fondoInicial, { onConflict: 'id' })
            .select()
            .single();
          if (!insertErr && inserted) {
            this.cajaFondo = inserted;
            this.persist('caja_fondo', inserted);
            this.notifyListeners({ type: 'DATA_LOADED' });
            return inserted;
          }
        }
      } catch (err) {
        console.warn('Error obteniendo/sembrando caja_fondo en Supabase:', err);
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
        // Asegurar que si una solicitud ya está RENDIDO, su monto refleje el total de comprobantes rendidos
        data.forEach(sol => {
          if (sol.estado === 'RENDIDO' && sol.rendiciones) {
            try {
              const list = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
              if (Array.isArray(list) && list.length > 0) {
                const total = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
                if (total > 0 && Number(sol.monto) !== total) {
                  sol.monto = total;
                  supabase.from('solicitudes').update({ monto: total }).eq('id', sol.id).then();
                }
              }
            } catch (e) {}
          }
          if (!sol.liquidacion_codigo && sol.observaciones_aprobador) {
            const match = sol.observaciones_aprobador.match(/\[Liquidado\s+(LIQ-[A-Z0-9_-]+)/i);
            if (match) {
              sol.liquidacion_codigo = match[1];
            }
          }
        });

        this.solicitudes = data;
        this.persist('caja_solicitudes', data);
        this.notifyListeners({ type: 'DATA_LOADED' });
        return data;
      }
    }
    return this.solicitudes;
  }

  sanitizeSolicitudForSupabase(sol) {
    const allowed = [
      'id', 'codigo', 'tipo', 'solicitante_dni', 'solicitante_nombre',
      'monto', 'moneda', 'motivo', 'categoria', 'centro_costo',
      'comprobante_tipo', 'comprobante_numero', 'comprobante_ruc_emisor',
      'comprobante_razon_social', 'comprobante_fecha', 'comprobante_archivo_url',
      'estado', 'aprobado_por_dni', 'aprobado_por_nombre', 'aprobado_fecha',
      'observaciones_aprobador', 'pagado_por_dni', 'pagado_por_nombre', 'pagado_fecha',
      'rendiciones', 'created_at',
      'abono_sustento_url', 'abono_sustento_nombre', 'abono_metodo', 'abono_operacion', 'abono_observacion', 'abono_fecha',
      'liquidacion_codigo', 'liquidado_fecha', 'liquidado_por_dni', 'liquidado_por_nombre'
    ];
    const clean = {};
    for (const key of allowed) {
      if (sol[key] !== undefined) {
        clean[key] = sol[key];
      }
    }
    return clean;
  }

  async createSolicitud(solData) {
    let maxNum = 0;
    for (const s of this.solicitudes) {
      if (s.codigo) {
        const match = s.codigo.match(/SOL-\d+-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
    }
    const correlativo = String(maxNum + 1).padStart(3, '0');
    let codigo = `SOL-2026-${correlativo}`;
    const catObj = this.categorias.find(c => c.id === solData.categoria || c.nombre === solData.categoria);
    const centro_costo = solData.centro_costo || catObj?.centro_costo || 'CC-GENERAL';

    const newSolicitud = {
      id: 'sol-' + Date.now(),
      codigo,
      moneda: 'PEN',
      estado: 'PENDIENTE',
      centro_costo,
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
        const cleanPayload = this.sanitizeSolicitudForSupabase(newSolicitud);
        const { error } = await supabase.from('solicitudes').insert(cleanPayload);
        if (error) {
          console.error('Error insertando solicitud en Supabase:', error);
          if (error.code === '23505') {
            // Colisión de código por concurrencia entre navegadores
            cleanPayload.codigo = `SOL-2026-${Date.now().toString().slice(-4)}`;
            newSolicitud.codigo = cleanPayload.codigo;
            await supabase.from('solicitudes').insert(cleanPayload);
            this.persist('caja_solicitudes', this.solicitudes);
          }
        }
      } catch (e) {
        console.warn('Error guardando solicitud en Supabase:', e);
      }
    }

    // Enviar notificación Push (OneSignal) a Administradores y Cajeros (USUARIO)
    const adminYCajerosDnis = this.usuarios.filter(u => u.roles?.includes('ADMINISTRADOR') || u.roles?.includes('USUARIO')).map(u => u.dni);
    this.sendOneSignalPush('Nueva Solicitud Registrada', `${solData.solicitante_nombre} ha registrado un gasto por S/ ${Number(solData.monto).toFixed(2)}.`, adminYCajerosDnis, { evento: 'NUEVA_SOLICITUD', solicitanteDni: solData.solicitante_dni });

    this.broadcastSync({ type: 'SOLICITUD_CREATED', solicitud: newSolicitud });
    return newSolicitud;
  }

  async updateEstadoSolicitud(id, nuevoEstado, adminUser, observaciones = '', extraData = {}) {
    const sol = this.solicitudes.find(s => s.id === id);
    if (!sol) throw new Error('Solicitud no encontrada');

    // Guardar el estado anterior ANTES de sobrescribirlo (necesario para reembolsos y devoluciones)
    const estadoPrevio = sol.estado;
    sol.estado = nuevoEstado;

    if (extraData && typeof extraData === 'object') {
      if (extraData.abono_sustento_url) sol.abono_sustento_url = extraData.abono_sustento_url;
      if (extraData.abono_sustento_nombre) sol.abono_sustento_nombre = extraData.abono_sustento_nombre;
      if (extraData.abono_metodo) sol.abono_metodo = extraData.abono_metodo;
      if (extraData.abono_operacion) sol.abono_operacion = extraData.abono_operacion;
      if (extraData.abono_observacion) sol.abono_observacion = extraData.abono_observacion;
      if (extraData.abono_fecha) sol.abono_fecha = extraData.abono_fecha;
    }

    if (nuevoEstado === 'APROBADO' || nuevoEstado === 'RECHAZADO') {
      sol.aprobado_por_dni = adminUser.dni;
      sol.aprobado_por_nombre = `${adminUser.nombres} ${adminUser.apellidos}`;
      sol.aprobado_fecha = new Date().toISOString();
      sol.observaciones_aprobador = observaciones;
    }

    // Si el Cajero/Usuario abona el dinero inicial, descontar del fondo disponible
    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      const monto = Number(sol.monto || 0);
      this.cajaFondo.monto_disponible = Math.max(0, this.cajaFondo.monto_disponible - monto);
      this.persist('caja_fondo', this.cajaFondo);

      sol.pagado_por_dni = adminUser.dni;
      sol.pagado_por_nombre = `${adminUser.nombres} ${adminUser.apellidos}`;
      sol.pagado_fecha = new Date().toISOString();
      if (observaciones) {
        sol.observaciones_aprobador = sol.observaciones_aprobador ? `${sol.observaciones_aprobador} | [Abono: ${observaciones}]` : `[Abono: ${observaciones}]`;
      }

      await this.syncCajaFondoToSupabase();
    }

    // Si el Cajero confirma la recepción del sobrante devuelto (de POR_DEVOLVER pasa a RENDIDO final)
    if (estadoPrevio === 'POR_DEVOLVER' && nuevoEstado === 'RENDIDO') {
      let totalRendido = 0;
      if (sol.rendiciones) {
        const list = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
        if (Array.isArray(list)) {
          totalRendido = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        }
      }
      const montoDevuelto = Math.max(0, Number((Number(sol.monto || 0) - totalRendido).toFixed(2)));
      if (montoDevuelto > 0) {
        this.cajaFondo.monto_disponible = Math.min(this.cajaFondo.monto_total, this.cajaFondo.monto_disponible + montoDevuelto);
        this.persist('caja_fondo', this.cajaFondo);
        await this.syncCajaFondoToSupabase();
      }
      sol.monto = totalRendido;
      const obsDev = `[Devolución S/ ${montoDevuelto.toFixed(2)} recibida por ${adminUser.nombres} ${adminUser.apellidos} el ${new Date().toLocaleString('es-PE')}]`;
      sol.observaciones_aprobador = sol.observaciones_aprobador ? `${sol.observaciones_aprobador} | ${obsDev}` : obsDev;
    }

    // Si el Cajero entrega el reembolso por exceso (de POR_REEMBOLSAR pasa a RENDIDO final)
    if (estadoPrevio === 'POR_REEMBOLSAR' && nuevoEstado === 'RENDIDO') {
      let totalRendido = 0;
      if (sol.rendiciones) {
        const list = typeof sol.rendiciones === 'string' ? JSON.parse(sol.rendiciones) : sol.rendiciones;
        if (Array.isArray(list)) {
          totalRendido = list.reduce((sum, c) => sum + Number(c.monto || 0), 0);
        }
      }
      const montoReembolso = Math.max(0, Number((totalRendido - Number(sol.monto || 0)).toFixed(2)));
      if (montoReembolso > 0) {
        this.cajaFondo.monto_disponible = Math.max(0, this.cajaFondo.monto_disponible - montoReembolso);
        this.persist('caja_fondo', this.cajaFondo);

        sol.pagado_por_dni = adminUser.dni;
        sol.pagado_por_nombre = `${adminUser.nombres} ${adminUser.apellidos}`;
        sol.pagado_fecha = new Date().toISOString();
        sol.monto = totalRendido;

        await this.syncCajaFondoToSupabase();
      }
    }

    this.persist('caja_solicitudes', this.solicitudes);

    // Notificación al solicitante específico
    let statusText = nuevoEstado;
    let title = `Solicitud ${statusText}: ${sol.codigo}`;
    let msg = `Tu solicitud por S/ ${Number(sol.monto).toFixed(2)} fue ${statusText.toLowerCase()} por ${adminUser.nombres}. ${observaciones ? 'Obs: ' + observaciones : ''}`;

    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      msg = `Tu solicitud ${sol.codigo} por S/ ${Number(sol.monto).toFixed(2)} ha sido ABONADA por caja (${adminUser.nombres}). El dinero ya ha sido entregado.`;
    } else if (nuevoEstado === 'POR_REEMBOLSAR') {
      title = `Reembolso Aprobado: ${sol.codigo}`;
      msg = `El Administrador (${adminUser.nombres}) aprobó el reembolso por tu gasto excedente. Pasa por Caja para cobrar tu saldo a favor.`;
    } else if (nuevoEstado === 'RENDIDO' && estadoPrevio === 'POR_REEMBOLSAR') {
      title = `Reembolso Pagado: ${sol.codigo}`;
      msg = `Caja te ha entregado el efectivo correspondiente a tu reembolso por exceso. Rendición finalizada y conforme.`;
    } else if (nuevoEstado === 'RENDIDO' && estadoPrevio === 'POR_DEVOLVER') {
      title = `Devolución Recibida: ${sol.codigo}`;
      msg = `Caja (${adminUser.nombres}) confirmó la recepción de tu devolución de efectivo. Rendición finalizada y conforme.`;
    }

    this.addNotification({
      titulo: title,
      mensaje: msg,
      tipo: nuevoEstado === 'APROBADO' || nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR' || nuevoEstado === 'RENDIDO' || nuevoEstado === 'POR_REEMBOLSAR' ? 'SUCCESS' : 'DANGER',
      usuario_dni: sol.solicitante_dni,
      referencia_id: sol.id
    });

    if (supabase) {
      try {
        const updatePayload = {
          estado: sol.estado,
          monto: Number(sol.monto || 0),
          aprobado_por_dni: sol.aprobado_por_dni,
          aprobado_por_nombre: sol.aprobado_por_nombre,
          aprobado_fecha: sol.aprobado_fecha,
          observaciones_aprobador: sol.observaciones_aprobador,
          pagado_por_dni: sol.pagado_por_dni,
          pagado_por_nombre: sol.pagado_por_nombre,
          pagado_fecha: sol.pagado_fecha
        };

        if (sol.abono_sustento_url) updatePayload.abono_sustento_url = sol.abono_sustento_url;
        if (sol.abono_sustento_nombre) updatePayload.abono_sustento_nombre = sol.abono_sustento_nombre;
        if (sol.abono_metodo) updatePayload.abono_metodo = sol.abono_metodo;
        if (sol.abono_operacion) updatePayload.abono_operacion = sol.abono_operacion;
        if (sol.abono_fecha) updatePayload.abono_fecha = sol.abono_fecha;

        await supabase.from('solicitudes').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('Error actualizando en Supabase:', e);
      }
    }

    // Enviar notificación Push (OneSignal)
    let msgPush = '';
    let targetPushDnis = [sol.solicitante_dni];

    if (nuevoEstado === 'PAGADO' || nuevoEstado === 'POR_RENDIR') {
      msgPush = `${adminUser.nombres} entregó el efectivo de tu solicitud ${sol.codigo}.`;
    } else if (nuevoEstado === 'APROBADO') {
      msgPush = `${adminUser.nombres} aprobó tu solicitud ${sol.codigo}. Cajero, proceda con la entrega.`;
      const cajerosDnis = this.usuarios.filter(u => u.roles?.includes('USUARIO')).map(u => u.dni);
      targetPushDnis = [...targetPushDnis, ...cajerosDnis];
    } else if (nuevoEstado === 'POR_REEMBOLSAR') {
      msgPush = `Reembolso autorizado para ${sol.codigo}. Cajero, proceda con el pago de la diferencia.`;
      const cajerosDnis = this.usuarios.filter(u => u.roles?.includes('USUARIO')).map(u => u.dni);
      targetPushDnis = [...targetPushDnis, ...cajerosDnis];
    } else if (nuevoEstado === 'RENDIDO' && estadoPrevio === 'POR_DEVOLVER') {
      msgPush = `${adminUser.nombres} confirmó la recepción de tu devolución para ${sol.codigo}. Rendición conforme.`;
    } else {
      msgPush = `Tu solicitud ${sol.codigo} fue actualizada a ${nuevoEstado}.`;
    }

    this.sendOneSignalPush(`Caja Chica: ${sol.codigo}`, msgPush, targetPushDnis, { evento: nuevoEstado, solicitanteDni: sol.solicitante_dni });

    this.broadcastSync({ type: 'SOLICITUD_STATUS_CHANGED', solicitud: sol, estado: nuevoEstado });
    return sol;
  }

  async rendirAdelanto(id, comprobantesArray) {
    const idx = this.solicitudes.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Solicitud no encontrada");

    const sol = this.solicitudes[idx];
    const totalRendido = comprobantesArray.reduce((acc, c) => acc + Number(c.monto || 0), 0);
    const adelanto = Number(sol.monto || 0);
    const diferencia = Number((totalRendido - adelanto).toFixed(2));

    sol.rendiciones = comprobantesArray;

    // Si gastó más del adelanto (diferencia > 0): pasa a PENDIENTE_REEMBOLSO para visto bueno del Admin
    // Si gastó menos (diferencia < 0): pasa a POR_DEVOLVER hasta que el Cajero confirme la recepción del sobrante
    // Si gastó exacto: pasa a RENDIDO
    const nuevoEstado = diferencia > 0 ? 'PENDIENTE_REEMBOLSO' : diferencia < 0 ? 'POR_DEVOLVER' : 'RENDIDO';
    sol.estado = nuevoEstado;

    // En POR_DEVOLVER el monto se mantiene como el adelanto: el fondo se repone recién cuando Caja confirma
    if (diferencia === 0) {
      sol.monto = totalRendido;
    }

    this.persist('caja_solicitudes', this.solicitudes);

    if (supabase) {
      try {
        const updatePayload = {
          rendiciones: comprobantesArray,
          estado: nuevoEstado
        };
        if (nuevoEstado === 'RENDIDO') {
          updatePayload.monto = totalRendido;
        }

        const { error } = await supabase
          .from('solicitudes')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          console.error("Error guardando rendición en Supabase:", error);
          throw error;
        }
      } catch (err) {
        console.error("Fallo al actualizar rendición en Supabase:", err);
        throw err;
      }
    }

    if (diferencia > 0) {
      this.addNotification({
        titulo: `Reembolso por Autorizar: ${sol.codigo}`,
        mensaje: `${sol.solicitante_nombre} rindió S/ ${totalRendido.toFixed(2)} sobre adelanto de S/ ${adelanto.toFixed(2)}. Exceso a su favor por autorizar: S/ ${diferencia.toFixed(2)}.`,
        tipo: 'WARNING',
        usuario_dni: 'ADMINS',
        referencia_id: sol.id
      });

      const adminDnis = this.usuarios.filter(u => u.roles?.includes('ADMINISTRADOR')).map(u => u.dni);
      this.sendOneSignalPush(`Reembolso ${sol.codigo}: S/ ${diferencia.toFixed(2)}`, `Rendición con exceso para autorizar a ${sol.solicitante_nombre}.`, adminDnis, { evento: 'REEMBOLSO_PENDIENTE', solicitanteDni: sol.solicitante_dni });
    } else if (diferencia < 0) {
      const devolucion = Math.abs(diferencia);
      this.addNotification({
        titulo: `Devolución por Recibir: ${sol.codigo}`,
        mensaje: `${sol.solicitante_nombre} rindió S/ ${totalRendido.toFixed(2)} sobre adelanto de S/ ${adelanto.toFixed(2)}. Debe devolver S/ ${devolucion.toFixed(2)} en Caja.`,
        tipo: 'WARNING',
        usuario_dni: 'ADMINS',
        referencia_id: sol.id
      });

      const cajerosDnis = this.usuarios.filter(u => u.roles?.includes('USUARIO')).map(u => u.dni);
      this.sendOneSignalPush(`Devolución ${sol.codigo}: S/ ${devolucion.toFixed(2)}`, `${sol.solicitante_nombre} debe devolver efectivo sobrante. Confirma la recepción en Arqueo & Balance.`, cajerosDnis, { evento: 'DEVOLUCION_PENDIENTE', solicitanteDni: sol.solicitante_dni });
    } else {
      this.addNotification({
        titulo: `Rendición Recibida: ${sol.codigo}`,
        mensaje: `${sol.solicitante_nombre} ha completado la rendición de su adelanto exitosamente.`,
        tipo: 'SUCCESS',
        usuario_dni: 'ADMINS',
        referencia_id: sol.id
      });
    }

    this.broadcastSync({ type: 'SOLICITUD_STATUS_CHANGED', solicitud: sol, estado: nuevoEstado });
    this.notifyListeners({ type: 'DATA_LOADED' });
    return sol;
  }

  async liquidarSolicitudesBatch({ solicitudIds, adminUser, codigoLiquidacion }) {
    if (!solicitudIds || solicitudIds.length === 0) return { count: 0, solicitudes: [] };

    const fechaLiq = new Date().toISOString();
    const adminNombre = adminUser ? `${adminUser.nombres} ${adminUser.apellidos}` : 'Administrador';
    const adminDni = adminUser?.dni || '';
    const actualizadas = [];

    for (const id of solicitudIds) {
      const sol = this.solicitudes.find(s => s.id === id);
      if (sol) {
        sol.estado = 'LIQUIDADO';
        sol.liquidado_fecha = fechaLiq;
        sol.liquidado_por_dni = adminDni;
        sol.liquidado_por_nombre = adminNombre;
        sol.liquidacion_codigo = codigoLiquidacion || '';

        const obsLiq = `[Liquidado ${codigoLiquidacion ? codigoLiquidacion + ' ' : ''}${new Date().toLocaleDateString('es-PE')} por ${adminNombre}]`;
        sol.observaciones_aprobador = sol.observaciones_aprobador 
          ? `${sol.observaciones_aprobador} | ${obsLiq}`
          : obsLiq;

        actualizadas.push(sol);

        if (supabase) {
          try {
            await supabase.from('solicitudes').update({
              estado: 'LIQUIDADO',
              observaciones_aprobador: sol.observaciones_aprobador,
              liquidacion_codigo: sol.liquidacion_codigo,
              liquidado_fecha: sol.liquidado_fecha,
              liquidado_por_dni: sol.liquidado_por_dni,
              liquidado_por_nombre: sol.liquidado_por_nombre
            }).eq('id', id);
          } catch (e) {
            console.warn('Error actualizando estado LIQUIDADO en Supabase:', e);
          }
        }
      }
    }

    this.persist('caja_solicitudes', this.solicitudes);

    this.addNotification({
      titulo: `Liquidación Procesada: ${codigoLiquidacion || 'Caja Chica'}`,
      mensaje: `${adminNombre} completó la liquidación de ${actualizadas.length} gastos rendidos de Caja Chica.`,
      tipo: 'SUCCESS',
      usuario_dni: adminDni
    });

    this.broadcastSync({ type: 'SOLICITUD_STATUS_CHANGED', liquidacionCodigo: codigoLiquidacion, count: actualizadas.length });
    this.notifyListeners({ type: 'DATA_LOADED' });

    return { count: actualizadas.length, solicitudes: actualizadas };
  }

  // --- REVERSA DE LIQUIDACIÓN CONTABLE (ADMIN) ---
  async revertirLiquidacion(codigoLiquidacion, adminUser, motivo = '') {
    if (!codigoLiquidacion) return { success: false, error: 'Código de liquidación requerido' };

    const adminNombre = adminUser ? `${adminUser.nombres} ${adminUser.apellidos}` : 'Administrador';
    const adminDni = adminUser?.dni || '';

    // Encontrar solicitudes asociadas a esta liquidación
    const sols = this.solicitudes.filter(s => 
      s.liquidacion_codigo === codigoLiquidacion || 
      (s.estado === 'LIQUIDADO' && s.observaciones_aprobador?.includes(codigoLiquidacion))
    );

    if (sols.length === 0) {
      return { success: false, error: `No se encontraron gastos vinculados al lote ${codigoLiquidacion}` };
    }

    const actualizadas = [];

    for (const sol of sols) {
      sol.estado = 'RENDIDO';
      sol.liquidacion_codigo = null;
      sol.liquidado_fecha = null;
      sol.liquidado_por_dni = null;
      sol.liquidado_por_nombre = null;

      // Actualizar observaciones para auditoría
      const notaReversa = `[Liquidación ${codigoLiquidacion} revertida el ${new Date().toLocaleDateString('es-PE')} por ${adminNombre}${motivo ? ': ' + motivo : ''}]`;
      sol.observaciones_aprobador = sol.observaciones_aprobador 
        ? `${sol.observaciones_aprobador} | ${notaReversa}` 
        : notaReversa;

      actualizadas.push(sol);

      if (supabase) {
        try {
          await supabase.from('solicitudes').update({
            estado: 'RENDIDO',
            liquidacion_codigo: null,
            liquidado_fecha: null,
            liquidado_por_dni: null,
            liquidado_por_nombre: null,
            observaciones_aprobador: sol.observaciones_aprobador
          }).eq('id', sol.id);
        } catch (e) {
          console.warn('Error revirtiendo liquidación en Supabase:', e);
        }
      }
    }

    this.persist('caja_solicitudes', this.solicitudes);

    this.addNotification({
      titulo: `Liquidación Revertida: ${codigoLiquidacion}`,
      mensaje: `${adminNombre} revirtió el lote ${codigoLiquidacion}. ${actualizadas.length} gasto(s) volvieron al estado RENDIDO.`,
      tipo: 'WARNING',
      usuario_dni: adminDni
    });

    this.broadcastSync({ type: 'SOLICITUD_STATUS_CHANGED', liquidacionRevertida: codigoLiquidacion, count: actualizadas.length });
    this.notifyListeners({ type: 'DATA_LOADED' });

    return { success: true, count: actualizadas.length, solicitudes: actualizadas };
  }

  // --- ASIGNACIÓN DE FONDOS (ADMIN) ---
  async updateFondoAsignado(nuevoMonto) {
    // Calculamos el monto gastado histórico o recalculamos en base a la diferencia
    const gastado = this.cajaFondo.monto_total - this.cajaFondo.monto_disponible;
    this.cajaFondo.monto_total = Number(nuevoMonto);
    this.cajaFondo.monto_disponible = Math.max(0, this.cajaFondo.monto_total - gastado);
    this.persist('caja_fondo', this.cajaFondo);

    await this.syncCajaFondoToSupabase();

    this.broadcastSync({ type: 'FONDO_UPDATED', fondo: this.cajaFondo });
    return this.cajaFondo;
  }

  async reponerFondo(montoRepuesto) {
    this.cajaFondo.monto_disponible = Math.min(this.cajaFondo.monto_total, this.cajaFondo.monto_disponible + Number(montoRepuesto));
    this.persist('caja_fondo', this.cajaFondo);

    await this.syncCajaFondoToSupabase();

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
