import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from "./utils.js";

//Obtiene dos inmuebles específicos o todos si se indica
export async function obtenerInmuebles(mostrarTodos = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/property/getProperties`);
    if (!response.ok) throw new Error("Error al obtener inmuebles");
    const todos = await response.json();

    if (mostrarTodos) return todos;

    const inmueblesDeseados = [
      "3DD34141-D414-4B4C-A477-23E6F4635D40",
      "ABAEB973-48A0-4C00-9FF3-2D1036B38F31",
    ];

    return todos.filter((i) => inmueblesDeseados.includes(i.PropertyID));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Renderiza los inmuebles en las tarjetas
export function renderInmuebles(lista, contenedor) {
  contenedor.innerHTML = "";
  lista.forEach((inmueble) => {
    const card = document.createElement("div");
    card.classList.add("tarjeta-inmueble");

    card.innerHTML = `
      <img src="assets/stockhouse.png" alt="Imagen inmueble">
      <div class="contenido">
        <h3>${inmueble.Title}</h3>
        <p class="precio">$${parseFloat(inmueble.Price).toLocaleString(
          "es-MX"
        )} MXN</p>
        <p class="direccion">${inmueble.Address}</p>
        <p class="estado">${inmueble.CurrentStatus}</p>
        <a href="detalles.html?propertyId=${encodeURIComponent(
          inmueble.PropertyID
        )}" class="boton-detalles">Ver Detalles</a>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

// Carga los detalles del inmueble desde la URL y renderiza la información
export async function cargarDetallesInmueble() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("propertyId");
  if (!propertyId) return null;

  try {
    const response = await fetch(
      `${API_BASE_URL}/property/propertyDetails?propertyId=${encodeURIComponent(
        propertyId
      )}`
    );
    if (!response.ok) throw new Error("No se pudo cargar el inmueble");
    const inmueble = await response.json();

    renderGaleria(inmueble.images || []);
    renderDetalles({
      titulo: inmueble.title,
      precio: inmueble.price,
      direccion: inmueble.address || "Dirección no disponible",
      descripcion: inmueble.description,
    });
    renderResenas(inmueble.reviews || [], inmueble.propertyId);
    renderPreguntas(inmueble.faqs || [], inmueble.propertyId);

    return {
      latitud: inmueble.latitude || 19.543,
      longitud: inmueble.longitude || -96.931,
      id: inmueble.propertyId,
    };
  } catch (error) {
    mostrarAlerta(
      "Error de conexión",
      "No se pudo cargar la información del inmueble."
    );
    return null;
  }
}

export async function pagarInmuebleYGenerarContrato(idInmueble) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const response = await fetch(`${API_BASE_URL}/contratos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idInmueble, idComprador: usuario.id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "No se pudo generar el contrato");
    }

    mostrarAlerta("Contrato generado exitosamente", "success");
    window.location.href = "contratos.html";
  } catch (error) {
    console.error(error);
    mostrarAlerta(error.message || "Error al procesar el pago", "error");
  }
}

export async function registrarInmuebleConImagenes(formElement) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || !usuario.UserID) {
      mostrarAlerta("Debe iniciar sesión", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", formElement.querySelector("#titulo").value.trim());
    formData.append(
      "categoryId",
      formElement.querySelector("#tipo").value === "Casa" ? 1 : 2
    );
    formData.append(
      "address",
      formElement.querySelector("#direccion").value.trim()
    );
    formData.append(
      "latitude",
      formElement.querySelector("#latitud").value.trim()
    );
    formData.append(
      "longitude",
      formElement.querySelector("#longitud").value.trim()
    );
    formData.append("price", formElement.querySelector("#precio").value.trim());
    formData.append(
      "description",
      formElement.querySelector("#descripcion").value.trim()
    );
    formData.append("ownerId", usuario.UserID);

    const files = formElement.querySelector("#input-fotos").files;
    for (let i = 0; i < files.length && i < 10; i++) {
      formData.append("images", files[i]); // ← importante: debe coincidir con el campo que usas en multer: `images`
    }

    const response = await fetch(`${API_BASE_URL}/property/createProperty`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error || "No se pudo registrar el inmueble");
      } else {
        const html = await response.text();
        throw new Error("Respuesta inesperada del servidor:\n" + html);
      }
    }

    mostrarAlerta("Inmueble publicado correctamente", "success");
    window.location.href = "cuenta.html";
  } catch (error) {
    console.error(error);
    mostrarAlerta(error.message || "Error al registrar inmueble", "error");
  }
}

export async function actualizarInmueble(id, data) {
  try {
    const response = await fetch(`${API_BASE_URL}/inmuebles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "No se pudo actualizar el inmueble");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    mostrarAlerta(error.message, "error");
    return null;
  }
}

function renderGaleria(imagenes) {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";
  imagenes.forEach((img) => {
    const image = document.createElement("img");
    image.src = img || "assets/stockhouse.png";
    image.alt = "Imagen inmueble";
    galeria.appendChild(image);
  });
}

function renderDetalles(inmueble) {
  const detalles = document.getElementById("detalles-inmueble");
  detalles.innerHTML = `
    <h2>${inmueble.titulo}</h2>
    <p><strong>Precio:</strong> $${inmueble.precio.toLocaleString(
      "es-MX"
    )} MXN</p>
    <p><strong>Dirección:</strong> ${inmueble.direccion}</p>
    <p>${inmueble.descripcion}</p>
  `;
}

function renderPreguntas(preguntas, inmuebleId) {
  const seccion = document.getElementById("seccion-preguntas");
  seccion.innerHTML = `
    <h3>Preguntas y respuestas</h3>
    <div class="pregunta-form">
      <input type="text" id="input-pregunta" placeholder="e.j. ¿Cuántas habitaciones tiene?" />
      <button id="btn-preguntar">Enviar</button>
    </div>
    <ul>
      ${preguntas
        .map(
          (p) =>
            `<li><strong>${p.dateAsked}:</strong> ${p.question}<br><em>Respuesta:</em> ${p.answer}</li>`
        )
        .join("")}
    </ul>
  `;

  document
    .getElementById("btn-preguntar")
    ?.addEventListener("click", async () => {
      const pregunta = document.getElementById("input-pregunta").value.trim();
      if (!pregunta) return;
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const res = await fetch(`${API_BASE_URL}/preguntas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idInmueble: inmuebleId,
            pregunta,
            idUsuario: usuario.id,
          }),
        });
        if (!res.ok) throw new Error();
        location.reload();
      } catch {
        mostrarAlerta("No se pudo registrar la pregunta", "error");
      }
    });
}

function renderResenas(resenas, inmuebleId) {
  const seccion = document.getElementById("seccion-resenas");
  seccion.innerHTML = `
    <h3>Reseñas del Inmueble y/o Arrendador</h3>
    <div class="review-form">
      <input type="text" id="input-resena" placeholder="e.j. ¡Muy buen lugar para vivir con las 3B!" />
      <input type="number" id="input-calificacion" placeholder="e.j. 5" min="1" max="5" />
      <button id="btn-resena">Dar reseña</button>
    </div>
    ${resenas
      .map(
        (r) => `
      <div>
        <p class="resena-usuario">Usuario:</p>
        <p>${r.comment}</p>
        <p><strong>Calificación:</strong> ${r.rating}</p>
      </div>`
      )
      .join("")}
  `;

  document.getElementById("btn-resena")?.addEventListener("click", async () => {
    const comentario = document.getElementById("input-resena").value.trim();
    const calificacion = parseInt(
      document.getElementById("input-calificacion").value
    );
    if (!comentario || isNaN(calificacion)) return;
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const res = await fetch(`${API_BASE_URL}/resenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idInmueble: inmuebleId,
          comentario,
          calificacion,
          idUsuario: usuario.id,
        }),
      });
      if (!res.ok) throw new Error();
      location.reload();
    } catch {
      mostrarAlerta("No se pudo registrar la reseña", "error");
    }
  });
}

export function initMapaDesdeAPI(lat, lng) {
  const mapa = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: { lat, lng },
  });
  new google.maps.Marker({ position: { lat, lng }, map: mapa });
}

document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || usuario.Role !== "LANDLORD") {
    mostrarAlerta("No tienes permisos para publicar inmuebles", "error");
    setTimeout(() => {
      window.location.href = "inmuebles.html";
    }, 1500);
    return;
  }
  const form = document.getElementById("form-publicar");
  const inputFotos = document.getElementById("input-fotos");
  const preview = document.getElementById("preview");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await registrarInmuebleConImagenes(form);
    });

    inputFotos?.addEventListener("change", () => {
      preview.innerHTML = "";
      const files = inputFotos.files;

      for (let i = 0; i < files.length && i < 10; i++) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.classList.add("preview-image");
          preview.appendChild(img);
        };
        reader.readAsDataURL(files[i]);
      }
    });
  }
});

// Función para obtener citas desde el backend
async function obtenerCitas() {
  try {
    const response = await fetch(`${API_BASE_URL}/property/getAppointments`);
    if (!response.ok) throw new Error("Error al obtener citas");
    return await response.json();
  } catch (error) {
    console.error("[Citas] Error al obtener citas:", error);
    return [];
  }
}

// Función para responder (aceptar/rechazar) cita
export async function responderCita(appointmentId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/property/updateAppointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ appointmentId, status })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Respuesta cita]", result.error);
      return;
    }

    console.log("✅ Respuesta enviada:", result.message);
    mostrarAlerta("Estado actualizado correctamente", "success");

    // Recargar citas
    const citas = await obtenerCitas();
    renderCitas(citas, document.getElementById("contenedor-citas"));
  } catch (error) {
    console.error("[Actualizar cita]", error);
    mostrarAlerta("Error al actualizar la cita", "error");
  }
}

// Función para renderizar las citas en el contenedor
function renderCitas(lista, contenedor) {
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p>No hay citas registradas.</p>";
    return;
  }

  lista.forEach((cita) => {
    const card = document.createElement("div");
    card.classList.add("tarjeta-inmueble");

    const estadoColor = cita.status === "Accepted" ? "green"
                        : cita.status === "Rejected" ? "red"
                        : "magenta";

    let botones = "";
    if (cita.status === "Pending") {
      botones = `
        <button class="boton-registrar" onclick="responderCita('${cita.email}', 'Accepted')">Aceptar</button>
        <button class="boton-cancelar" onclick="responderCita('${cita.email}', 'Rejected')">Rechazar</button>
      `;
    }

    card.innerHTML = `
      <div class="contenido">
        <h3>${cita.fullName}</h3>
        <p><strong>Correo:</strong> ${cita.email}</p>
        <p><strong>Teléfono:</strong> ${cita.phone}</p>
        <p><strong>Estado:</strong> <span style="color:${estadoColor}; font-weight:bold;">${cita.status}</span></p>
        ${cita.responseDate ? `<p><strong>Fecha de respuesta:</strong> ${cita.responseDate.split("T")[0]}</p>` : ""}
        ${cita.visitDate ? `<p><strong>Fecha de visita:</strong> ${cita.visitDate.split("T")[0]}</p>` : ""}
        ${botones}
      </div>
    `;

    contenedor.appendChild(card);
  });
}

window.responderCita = responderCita;

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-citas");
  if (contenedor) {
    const citas = await obtenerCitas();
    renderCitas(citas, contenedor);
  }
});