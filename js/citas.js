import { API_BASE_URL } from './utils.js';
import { mostrarAlerta } from './utils.js';

const contenedor = document.getElementById('contenedor-citas');
const usuario = JSON.parse(localStorage.getItem('usuario'));

async function cargarCitas() {
  try {
    const res = await fetch(`${API_BASE_URL}/citas?idUsuario=${usuario.id}`);
    if (!res.ok) throw new Error('Error al obtener citas');
    const citas = await res.json();

    contenedor.innerHTML = '';
    citas.forEach(cita => {
      const card = document.createElement('div');
      card.className = 'card-cita';
      card.style.cssText = 'background-color: #f2f2f2; padding: 20px; border-radius: 8px; width: 300px;';

      let estadoColor = cita.estado === 'Aceptado' ? 'green' : cita.estado === 'Rechazado' ? 'red' : 'magenta';

      card.innerHTML = `
        <h3 style="margin-top: 0;">${cita.nombreCompleto}</h3>
        <p>${cita.email}</p>
        <p>${cita.telefono}</p>
        <p>Estado: <span style="color: ${estadoColor};">${cita.estado}</span></p>
        ${cita.fechaRespuesta ? `<p><strong>Fecha de respuesta:</strong> ${cita.fechaRespuesta}</p>` : ''}
        ${cita.fechaVisita ? `<p><strong>Fecha de visita:</strong> ${cita.fechaVisita}</p>` : ''}
      `;

      if (cita.estado === 'Pendiente') {
        const btnAceptar = document.createElement('button');
        btnAceptar.className = 'boton-registrar';
        btnAceptar.textContent = 'Aceptar';
        btnAceptar.style.cssText = 'width: 100%; margin-top: 10px;';
        btnAceptar.onclick = () => responderCita(cita.id, 'Aceptado');

        const btnRechazar = document.createElement('button');
        btnRechazar.className = 'boton-cancelar';
        btnRechazar.textContent = 'Rechazar';
        btnRechazar.style.cssText = 'width: 100%; margin-top: 10px;';
        btnRechazar.onclick = () => responderCita(cita.id, 'Rechazado');

        card.appendChild(btnAceptar);
        card.appendChild(btnRechazar);
      }

      contenedor.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    mostrarAlerta('No se pudieron cargar las citas', 'error');
  }
}

async function responderCita(idCita, estado) {
  try {
    const res = await fetch(`${API_BASE_URL}/citas/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idCita, estado })
    });
    if (!res.ok) throw new Error();
    mostrarAlerta(`Cita ${estado.toLowerCase()} correctamente`, 'success');
    cargarCitas();
  } catch {
    mostrarAlerta('No se pudo actualizar la cita', 'error');
  }
}

document.addEventListener('DOMContentLoaded', cargarCitas);