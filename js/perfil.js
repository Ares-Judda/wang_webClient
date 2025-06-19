import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from './utils.js';

// Registro de nuevo usuario
const formRegistro = document.getElementById('form-registro');
formRegistro?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombreCompleto = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const rol = document.getElementById('rol').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!nombreCompleto || !telefono || !direccion || !rol || !email || !password) {
    mostrarAlerta('Todos los campos son obligatorios', 'warning');
    return;
  }

  const partesNombre = nombreCompleto.split(' ');
  const name = partesNombre[0];
  const lastname = partesNombre.slice(1).join(' ') || 'Apellido';

  const userName = email.split('@')[0];

  const formData = new FormData();
  formData.append('name', name);
  formData.append('lastname', lastname);
  formData.append('userName', userName);
  formData.append('phone', telefono);
  formData.append('address', direccion);
  formData.append('role', rol);
  formData.append('email', email);
  formData.append('password', password);

  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      mostrarAlerta(result.error || 'Error en el registro', 'error');
      return;
    }

    mostrarAlerta('Usuario registrado exitosamente', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    console.error(error);
    mostrarAlerta('Error de conexión con el servidor', 'error');
  }
});

// Cambio de contraseña
const formReset = document.getElementById('form-password-reset');
formReset?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const newPassword = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!email || !newPassword || !confirmPassword) {
    mostrarAlerta('Todos los campos son obligatorios', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/changePassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, confirmPassword })
    });

    const result = await response.json();

    if (!response.ok) {
      mostrarAlerta(result.error || 'Error al cambiar la contraseña', 'error');
      return;
    }

    mostrarAlerta(result.message || 'Contraseña actualizada exitosamente', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    console.error(error);
    mostrarAlerta('Error de conexión con el servidor', 'error');
  }
});

// Carga inmuebles asociados al usuario logueado
document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('contenedor-inmuebles');
  if (!contenedor) return;

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario?.id || !usuario?.rol) {
    mostrarAlerta('No se pudo obtener la información del usuario.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inmuebles/autor/${usuario.id}`);
    if (!response.ok) throw new Error('Error al obtener inmuebles');

    const inmuebles = await response.json();
    contenedor.innerHTML = '';

    inmuebles.forEach(inmueble => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-inmueble';
      tarjeta.innerHTML = `
        <img src="${inmueble.imagen || 'assets/stockhouse.png'}" alt="Imagen del inmueble" />
        <div class="contenido">
          <h3>${inmueble.titulo}</h3>
          <p class="precio">$${inmueble.precio.toLocaleString('es-MX')} MXN</p>
          <p class="direccion">${inmueble.direccion}</p>
          <p class="agente">${inmueble.autor}</p>
          <button class="boton-registrar" onclick="redirigir(${inmueble.id})">
            ${usuario.rol === 'Arrendatario' ? 'Pagar' : 'Modificar'}
          </button>
        </div>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    console.error(error);
    mostrarAlerta('No se pudieron cargar los inmuebles', 'error');
  }
});

// Modificar cuenta
document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
  document.getElementById("nombre").value = usuario.nombre || "";
  document.getElementById("telefono").value = usuario.telefono || "";
  document.getElementById("direccion").value = usuario.direccion || "";
  document.getElementById("rol").value = usuario.rol || "";
  document.getElementById("email").value = usuario.email || "";
  document.getElementById("password").value = usuario.password || ""; // Solo si se requiere mostrar

  document.getElementById("form-modificar")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: nombre, phone: telefono, address: direccion })
      });

      if (!response.ok) throw new Error();
      mostrarAlerta("Cuenta actualizada correctamente", "success");
      window.location.href = "cuenta.html";
    } catch {
      mostrarAlerta("No se pudo actualizar la cuenta", "error");
    }
  });
});