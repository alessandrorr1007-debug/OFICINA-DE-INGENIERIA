// Gestor de Conexiones de Planta 1 · Paul Engineering Studio
(function () {
  'use strict';

  const STORAGE_KEY = 'office3d-station-statuses';
  const registry = window.STATIONS_REGISTRY || {};

  // Estado local en memoria (solo estado y metadatos no sensibles)
  let cachedStatuses = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cachedStatuses = JSON.parse(raw);
  } catch (_) {
    cachedStatuses = {};
  }

  function saveLocalStatus(id, data) {
    cachedStatuses[id] = {
      status: data.status || 'Desconectado',
      configured: Boolean(data.configured),
      updatedAt: data.updatedAt || null,
      lastTestedAt: data.lastTestedAt || null,
      lastTestMessage: data.lastTestMessage || null,
      masked: data.masked || {}
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedStatuses));
    } catch (_) {}
    updateAllStationVisuals();
  }

  function getStatus(id) {
    return cachedStatuses[id] || { status: 'Desconectado', configured: false };
  }

  function getStatusClass(status) {
    const map = {
      'Desconectado': 'status-desconectado',
      'Conectando': 'status-conectando',
      'Conectado': 'status-conectado',
      'Error': 'status-error',
      'Límite alcanzado': 'status-limite-alcanzado'
    };
    return map[status] || 'status-desconectado';
  }

  // Consulta el estado real al servidor Netlify Functions
  async function fetchStatusesFromServer() {
    try {
      const res = await fetch('/api/connections?action=status');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok && data.stations) {
        for (const [id, sData] of Object.entries(data.stations)) {
          saveLocalStatus(id, sData);
        }
      }
    } catch (_) {}
  }

  // Actualiza los carteles flotantes y la lista lateral en el edificio
  function updateAllStationVisuals() {
    if (typeof connectionStations !== 'undefined') {
      for (const s of connectionStations) {
        const info = getStatus(s.id);
        s.estado = info.status;
      }
    }

    // Actualizar lista en el panel lateral
    const list = document.getElementById('station-list');
    if (list && typeof connectionStations !== 'undefined') {
      list.innerHTML = connectionStations.map(s => {
        const info = getStatus(s.id);
        const st = info.status || 'Desconectado';
        const dotColor = st === 'Conectado' ? '#256641' : (st === 'Error' ? '#b43a3a' : (st === 'Conectando' ? '#a36c28' : s.color));
        return `<button class="station-card" data-station="${s.id}">
          <span style="background:${dotColor}" class="station-dot"></span>
          <b>${escapeHtml(s.nombre)}</b>
          <small class="station-card-status ${getStatusClass(st)}">● ${escapeHtml(st)} · ${escapeHtml(s.encargado.name)}</small>
        </button>`;
      }).join('');
    }

    // Actualizar etiquetas flotantes de las estaciones
    if (typeof stationSigns !== 'undefined' && Array.isArray(stationSigns)) {
      for (const { s, b } of stationSigns) {
        const info = getStatus(s.id);
        const st = info.status || 'Desconectado';
        b.className = `room-label station-label ${getStatusClass(st)}`;
        b.innerHTML = `${escapeHtml(s.nombre)}<small>● ${escapeHtml(st)}</small>`;
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Actualización de la vista del diálogo de estación (#station-dialog)
  function renderStationDialogView(station) {
    if (!station) return;
    const info = getStatus(station.id);
    const isConnected = info.status === 'Conectado';
    const isConnecting = info.status === 'Conectando';

    const badge = document.getElementById('station-status-badge');
    if (badge) {
      badge.className = `station-badge ${getStatusClass(info.status)}`;
      badge.textContent = `● ${info.status || 'Desconectado'}`;
    }

    const desc = document.getElementById('station-description');
    const connectWrap = document.getElementById('station-connect-wrap');
    const connectBtn = document.getElementById('station-connect-btn');
    const connectionSoon = document.getElementById('connection-soon');

    const def = registry[station.id];
    const isAvailable = def && !def.proximamente;

    if (isConnected) {
      // Regla: si está conectada, ocultar descripción de qué hará y el botón conectar
      if (desc) desc.hidden = true;
      if (connectWrap) connectWrap.hidden = true;
    } else {
      // Si está desconectada o en error
      if (desc) desc.hidden = false;
      if (connectWrap) connectWrap.hidden = false;
      if (connectBtn) {
        if (isAvailable) {
          connectBtn.disabled = isConnecting;
          connectBtn.textContent = isConnecting ? 'Conectando...' : 'Conectar';
          connectBtn.onclick = () => openConfigModal(station.id);
          if (connectionSoon) connectionSoon.hidden = true;
        } else {
          connectBtn.disabled = true;
          connectBtn.textContent = 'Conectar';
          if (connectionSoon) connectionSoon.hidden = false;
        }
      }
    }

    const gearBtn = document.getElementById('station-gear-btn');
    if (gearBtn) {
      gearBtn.onclick = () => openConfigModal(station.id);
      gearBtn.title = `Configurar ${station.nombre}`;
      gearBtn.setAttribute('aria-label', `Configurar ${station.nombre}`);
      gearBtn.style.display = isAvailable ? 'inline-flex' : 'none';
    }
  }

  // Apertura del modal de configuración (#station-config-dialog)
  function openConfigModal(stationId) {
    const def = registry[stationId];
    if (!def || def.proximamente) {
      if (typeof toast === 'function') toast('Esta estación estará disponible próximamente.');
      return;
    }

    const dialog = document.getElementById('station-config-dialog');
    if (!dialog) return;

    const info = getStatus(stationId);
    document.getElementById('station-config-title').textContent = `${def.nombre} · ${def.encargado}`;
    
    const badge = document.getElementById('station-config-badge');
    badge.className = `station-badge ${getStatusClass(info.status)}`;
    badge.textContent = `● ${info.status || 'Desconectado'}`;

    const meta = document.getElementById('station-config-meta');
    if (info.configured && info.updatedAt) {
      const d = new Date(info.updatedAt);
      meta.textContent = `Guardado: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      meta.textContent = 'Sin credenciales guardadas';
    }

    // Renderizar solo los campos de esta estación
    const container = document.getElementById('station-fields-container');
    container.innerHTML = '';

    for (const field of def.fields || []) {
      const group = document.createElement('div');
      group.className = 'field-group';

      const label = document.createElement('label');
      label.setAttribute('for', `field-${field.id}`);
      label.textContent = field.label;
      group.append(label);

      if (field.type === 'select') {
        const select = document.createElement('select');
        select.id = `field-${field.id}`;
        select.name = field.id;
        for (const opt of field.options || []) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (info.masked && info.masked[field.id] === opt.value) {
            option.selected = true;
          } else if (field.default === opt.value && (!info.masked || !info.masked[field.id])) {
            option.selected = true;
          }
          select.append(option);
        }
        group.append(select);
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';

        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.id = `field-${field.id}`;
        input.name = field.id;
        input.placeholder = info.masked && info.masked[field.id] ? `${info.masked[field.id]} (Modificar)` : (field.placeholder || '');
        input.autocomplete = 'off';
        input.spellcheck = false;
        wrapper.append(input);

        // Ojito para campos secretos
        if (field.type === 'password') {
          const eyeBtn = document.createElement('button');
          eyeBtn.type = 'button';
          eyeBtn.className = 'icon-btn';
          eyeBtn.title = 'Mostrar valor';
          eyeBtn.setAttribute('aria-label', 'Mostrar valor');
          eyeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
          eyeBtn.onclick = () => {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            eyeBtn.title = isPass ? 'Ocultar valor' : 'Mostrar valor';
          };
          wrapper.append(eyeBtn);
        }
        group.append(wrapper);
      }

      if (field.help) {
        const help = document.createElement('small');
        help.className = 'field-help';
        help.textContent = field.help;
        group.append(help);
      }

      container.append(group);
    }

    // Botón desconectar visible solo si hay credenciales guardadas
    const disconnectBtn = document.getElementById('station-disconnect-btn');
    disconnectBtn.hidden = !info.configured;

    // Limpiar mensaje previo de prueba
    const testBox = document.getElementById('station-test-result');
    testBox.hidden = true;
    testBox.textContent = '';
    testBox.className = 'test-result-box';

    // Resetear opción de contraseña de oficina
    const reqPassCheck = document.getElementById('require-office-pass');
    const passInputWrap = document.getElementById('office-pass-input-wrap');
    const passInput = document.getElementById('office-pass-input');
    reqPassCheck.checked = false;
    passInputWrap.hidden = true;
    passInput.value = '';

    reqPassCheck.onchange = () => {
      passInputWrap.hidden = !reqPassCheck.checked;
      if (reqPassCheck.checked) passInput.focus();
    };

    // Asignar manejadores de acción
    setupConfigActions(stationId);

    dialog.showModal();
  }

  function setupConfigActions(stationId) {
    const form = document.getElementById('station-config-form');
    const testBtn = document.getElementById('station-test-btn');
    const disconnectBtn = document.getElementById('station-disconnect-btn');
    const testBox = document.getElementById('station-test-result');
    const saveBtn = document.getElementById('station-save-btn');

    // Manejador: GUARDAR
    form.onsubmit = async (e) => {
      e.preventDefault();
      const def = registry[stationId];
      if (!def) return;

      const fields = {};
      let hasNewValues = false;
      for (const f of def.fields || []) {
        const el = document.getElementById(`field-${f.id}`);
        if (el) {
          const val = el.value.trim();
          if (val) {
            fields[f.id] = val;
            hasNewValues = true;
          }
        }
      }

      const info = getStatus(stationId);
      if (!hasNewValues && !info.configured) {
        showTestMessage('Ingresa los datos requeridos antes de guardar.', 'error');
        return;
      }

      const officePassword = document.getElementById('require-office-pass').checked
        ? document.getElementById('office-pass-input').value.trim()
        : '';

      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      try {
        const res = await fetch('/api/connections?action=save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stationId, fields, officePassword })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          showTestMessage(data.error || 'Error al guardar credenciales.', 'error');
          return;
        }

        saveLocalStatus(stationId, {
          status: 'Conectado',
          configured: true,
          updatedAt: data.updatedAt,
          masked: data.masked
        });

        // Vaciar campos de contraseña de inmediato por seguridad
        for (const f of def.fields || []) {
          const el = document.getElementById(`field-${f.id}`);
          if (el && f.type === 'password') el.value = '';
        }
        document.getElementById('office-pass-input').value = '';

        showTestMessage('Configurado con éxito ✓ Credenciales cifradas en el servidor.', 'success');
        disconnectBtn.hidden = false;

        const currentStation = typeof selectedStation !== 'undefined' ? selectedStation : null;
        if (currentStation && currentStation.id === stationId) {
          renderStationDialogView(currentStation);
        }
      } catch (err) {
        showTestMessage('Error de conexión con el servidor al guardar.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
      }
    };

    // Manejador: PROBAR CONEXIÓN
    testBtn.onclick = async () => {
      const def = registry[stationId];
      if (!def) return;

      // Animación de "trabajando / en llamada" en el encargado de la estación
      setAttendantCallingAnimation(stationId, true);

      testBtn.disabled = true;
      testBtn.textContent = 'Probando...';
      showTestMessage('Conectando con el servicio...', 'info');

      // Leer campos si el usuario está escribiendo antes de guardar
      const fields = {};
      for (const f of def.fields || []) {
        const el = document.getElementById(`field-${f.id}`);
        if (el && el.value.trim()) fields[f.id] = el.value.trim();
      }

      try {
        const res = await fetch('/api/connections?action=test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stationId, fields: Object.keys(fields).length ? fields : undefined })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          showTestMessage(data.message, 'success');
          saveLocalStatus(stationId, {
            status: 'Conectado',
            configured: true,
            lastTestedAt: new Date().toISOString(),
            lastTestMessage: data.message
          });
        } else {
          const st = data.status || 'Error';
          showTestMessage(data.error || 'Fallo en la prueba de conexión.', st === 'Límite alcanzado' ? 'limit' : 'error');
          saveLocalStatus(stationId, {
            status: st,
            lastTestedAt: new Date().toISOString(),
            lastTestMessage: data.error
          });
        }

        const badge = document.getElementById('station-config-badge');
        const currentInfo = getStatus(stationId);
        if (badge) {
          badge.className = `station-badge ${getStatusClass(currentInfo.status)}`;
          badge.textContent = `● ${currentInfo.status}`;
        }

        const currentStation = typeof selectedStation !== 'undefined' ? selectedStation : null;
        if (currentStation && currentStation.id === stationId) {
          renderStationDialogView(currentStation);
        }
      } catch (err) {
        showTestMessage('Error de red al realizar la prueba.', 'error');
      } finally {
        setAttendantCallingAnimation(stationId, false);
        testBtn.disabled = false;
        testBtn.textContent = 'Probar conexión';
      }
    };

    // Manejador: DESCONECTAR
    disconnectBtn.onclick = async () => {
      const def = registry[stationId];
      if (!def) return;

      const confirmed = window.confirm(`¿Seguro que deseas desconectar ${def.nombre} y borrar todas sus credenciales cifradas?`);
      if (!confirmed) return;

      const officePassword = document.getElementById('require-office-pass').checked
        ? document.getElementById('office-pass-input').value.trim()
        : '';

      disconnectBtn.disabled = true;
      disconnectBtn.textContent = 'Desconectando...';

      try {
        const res = await fetch('/api/connections?action=delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stationId, officePassword })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          showTestMessage(data.error || 'No se pudo desconectar.', 'error');
          return;
        }

        saveLocalStatus(stationId, {
          status: 'Desconectado',
          configured: false,
          masked: {}
        });

        showTestMessage('Estación desconectada y credenciales eliminadas.', 'info');
        disconnectBtn.hidden = true;

        const badge = document.getElementById('station-config-badge');
        if (badge) {
          badge.className = 'station-badge status-desconectado';
          badge.textContent = '● Desconectado';
        }

        const currentStation = typeof selectedStation !== 'undefined' ? selectedStation : null;
        if (currentStation && currentStation.id === stationId) {
          renderStationDialogView(currentStation);
        }
      } catch (_) {
        showTestMessage('Error al desconectar.', 'error');
      } finally {
        disconnectBtn.disabled = false;
        disconnectBtn.textContent = 'Desconectar';
      }
    };
  }

  function showTestMessage(msg, type) {
    const box = document.getElementById('station-test-result');
    if (!box) return;
    box.hidden = false;
    box.textContent = msg; // textContent estricto para evitar inyección XSS de respuestas no confiables
    box.className = `test-result-box type-${type}`;
  }

  function setAttendantCallingAnimation(stationId, isCalling) {
    if (typeof building !== 'undefined' && building.attendants) {
      const att = building.attendants.find(a => a.station === stationId);
      if (att) {
        att.calling = isCalling;
        if (isCalling) {
          att.mode = 'working';
          att.callingTimer = 15;
        }
      }
    }
  }

  // Interceptar la apertura de estación nativa
  window.addEventListener('DOMContentLoaded', () => {
    fetchStatusesFromServer();

    // Vigilar si se abre station-dialog
    const dialog = document.getElementById('station-dialog');
    if (dialog) {
      const observer = new MutationObserver(() => {
        if (dialog.open && typeof selectedStation !== 'undefined') {
          renderStationDialogView(selectedStation);
        }
      });
      observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }
  });

  // Exponer API global limpia
  window.PaulConnections = {
    getStatus,
    openConfigModal,
    renderStationDialogView,
    updateAllStationVisuals,
    fetchStatusesFromServer
  };
})();
