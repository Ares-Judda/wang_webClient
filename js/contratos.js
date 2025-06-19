import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-contratos");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  try {
    const response = await fetch(`${API_BASE_URL}/contratos/${usuario.id}`);
    if (!response.ok) throw new Error("Error al cargar contratos");

    const contratos = await response.json();
    contenedor.innerHTML = "";

    if (contratos.length === 0) {
      contenedor.innerHTML = "<p>No tienes contratos registrados.</p>";
      return;
    }

    contratos.forEach(c => {
      const div = document.createElement("div");
      div.style = "background-color: #f2f2f2; padding: 20px; border-radius: 8px; width: 300px;";

      div.innerHTML = `
        <h3 style="margin-top: 0;">${c.titulo}</h3>
        <p>${c.nombreUsuario}</p>
        <p>Fecha de inicio: ${c.fechaInicio}</p>
        <p>Fecha de fin: ${c.fechaFin}</p>
        <button class="boton-registrar" style="width: 100%; margin-top: 10px;">Descargar</button>
      `;

      const boton = div.querySelector("button");
      boton.addEventListener("click", () => descargarContrato(c.id));

      contenedor.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    mostrarAlerta("No se pudieron cargar los contratos", "error");
  }
});

async function descargarContrato(idContrato) {
  try {
    const res = await fetch(`${API_BASE_URL}/contratos/descargar/${idContrato}`);
    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato_${idContrato}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    mostrarAlerta("Error al descargar el contrato", "error");
  }
}
