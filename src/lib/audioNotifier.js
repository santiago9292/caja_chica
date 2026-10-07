// Sintetizador Web Audio API y alertas sensoriales para notificaciones en vivo
let audioCtx = null;
let titleInterval = null;
let originalTitle = typeof document !== 'undefined' ? document.title : 'CAJA CHICA DICAR LOGISTIC';

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Desbloquear audio automáticamente con la primera interacción del usuario en la página
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // Restaurar título original cuando el usuario regresa a la pestaña
  window.addEventListener('focus', () => {
    stopTitleFlash();
  });
}

export function flashTitle(alertText = '🔔 ¡Nueva Notificación!') {
  if (typeof document === 'undefined') return;
  stopTitleFlash();
  originalTitle = document.title || 'CAJA CHICA DICAR LOGISTIC';
  let isOriginal = false;
  titleInterval = setInterval(() => {
    document.title = isOriginal ? originalTitle : alertText;
    isOriginal = !isOriginal;
  }, 1000);
}

export function stopTitleFlash() {
  if (titleInterval) {
    clearInterval(titleInterval);
    titleInterval = null;
  }
  if (typeof document !== 'undefined' && originalTitle) {
    document.title = originalTitle;
  }
}

export function playNotificationSound(type = 'success') {
  // 1. Vibración háptica en teléfonos móviles Android
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'alert') {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } else if (type === 'success') {
        navigator.vibrate([150, 50, 150]);
      } else {
        navigator.vibrate([300]);
      }
    }
  } catch (e) {}

  // 2. Parpadeo en la barra de tareas / pestaña en PC si está en segundo plano
  if (typeof document !== 'undefined' && document.hidden) {
    flashTitle(type === 'alert' ? '🔔 (1) ¡Nueva Solicitud!' : '🔔 Solicitud Actualizada');
  }

  // 3. Síntesis de sonido acústico
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Tono ascendente agradable de confirmación / aprobación
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert') {
      // Tono doble de alerta para nueva solicitud pendiente
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'reject') {
      // Tono grave para rechazo
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn('Audio no disponible o bloqueado por el navegador:', e);
  }
}
