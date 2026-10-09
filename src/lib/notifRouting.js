// Enrutamiento de notificaciones: decide a qué pestaña llevar al usuario al hacer clic.
// La notificación solo transporta el EVENTO y el DNI del solicitante; cada dispositivo
// resuelve el destino según los roles del usuario que tiene la sesión iniciada.

export const TAB_ROLES = {
  nuevo: ['SOLICITANTE'],
  mis_solicitudes: ['SOLICITANTE'],
  aprobaciones: ['ADMINISTRADOR'],
  arqueo: ['ADMINISTRADOR', 'USUARIO', 'SYSADMIN'],
  maestro_dni: ['SYSADMIN'],
  maestro_categorias: ['SYSADMIN'],
  reportes: ['ADMINISTRADOR', 'SYSADMIN', 'USUARIO'],
};

// Eventos dirigidos a quienes gestionan la caja (no al solicitante)
const EVENTOS_GESTION = {
  NUEVA_SOLICITUD: ['aprobaciones', 'arqueo'],     // Admin aprueba, cajero se entera
  REEMBOLSO_PENDIENTE: ['aprobaciones', 'arqueo'], // Admin autoriza exceso
  DEVOLUCION_PENDIENTE: ['arqueo', 'aprobaciones'], // Cajero confirma recepción del sobrante
};

// Destino para los cajeros/gestores en cambios de estado (APROBADO, POR_REEMBOLSAR...)
const DESTINO_GESTION_ESTADO = ['arqueo', 'aprobaciones'];

export function canAccessTab(user, tab) {
  const roles = user?.roles || [];
  return (TAB_ROLES[tab] || []).some((r) => roles.includes(r));
}

/** Construye la URL que se abrirá al hacer clic en la notificación */
export function buildNotifUrl(evento, solicitanteDni = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({ notif: evento });
  if (solicitanteDni) params.set('sol', String(solicitanteDni));
  return `${origin}/?${params.toString()}`;
}

/** Devuelve la pestaña destino para el usuario actual, o null si no tiene acceso a ninguna */
export function resolveTabForEvent(user, evento, solicitanteDni) {
  if (!user || !evento) return null;

  let candidatos;
  if (EVENTOS_GESTION[evento]) {
    candidatos = EVENTOS_GESTION[evento];
  } else if (solicitanteDni && String(user.dni) === String(solicitanteDni)) {
    // Es el dueño de la solicitud: ver el estado en "Mis Solicitudes"
    candidatos = ['mis_solicitudes', ...DESTINO_GESTION_ESTADO];
  } else {
    // Cajero/Admin notificado de un cambio de estado (p. ej. debe entregar efectivo)
    candidatos = DESTINO_GESTION_ESTADO;
  }

  return candidatos.find((tab) => canAccessTab(user, tab)) || null;
}

/** Lee (y limpia de la barra de direcciones) los parámetros de notificación de la URL */
export function consumeNotifFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const evento = params.get('notif');
  if (!evento) return null;
  const sol = params.get('sol') || '';
  window.history.replaceState(null, '', window.location.pathname);
  return { evento, sol };
}
