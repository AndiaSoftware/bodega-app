
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let historial = JSON.parse(localStorage.getItem("historial")) || [];

document.addEventListener("DOMContentLoaded", () => {
  mostrarProductos();
  mostrarHistorial();
  actualizarSelectorProductos();
  mostrarMensajeAyuda();
});

function mostrarMensaje(mensaje, tipo = "success") {
  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo} alert-dismissible fade show mt-2`;
  alerta.role = "alert";
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.querySelector(".container").prepend(alerta);

  setTimeout(() => {
    alerta.classList.remove("show");
    alerta.classList.add("hide");
  }, 4000);
}

function mostrarMensajeAyuda() {
  const ayuda = document.createElement("div");
  ayuda.className = "alert alert-info alert-dismissible fade show";
  ayuda.role = "alert";
  ayuda.innerHTML = `
    Puedes buscar productos por <strong>nombre</strong> o <strong>código</strong> usando la barra de búsqueda debajo de "Productos".
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.querySelector(".container").prepend(ayuda);
}

function agregarProducto() {
  const codigo = document.getElementById("codigo").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const stock = parseInt(document.getElementById("stock").value);
  const stockMin = parseInt(document.getElementById("stock-min").value);

  if (!codigo || !nombre || isNaN(stock) || isNaN(stockMin)) {
    mostrarMensaje("Completa todos los campos correctamente.", "danger");
    return;
  }

  if (productos.some(p => p.codigo === codigo)) {
    mostrarMensaje("Ya existe un producto con ese código.", "warning");
    return;
  }

  const nuevoProducto = { codigo, nombre, stock, stockMin };
  productos.push(nuevoProducto);
  localStorage.setItem("productos", JSON.stringify(productos));
  mostrarProductos();
  actualizarSelectorProductos();
  limpiarFormulario();
  mostrarMensaje("Producto agregado exitosamente.");
}

function mostrarProductos(filtro = "") {
  const tbody = document.getElementById("productos-body");
  tbody.innerHTML = "";

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  productosFiltrados.forEach((p, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = \`
      <td>\${p.codigo}</td>
      <td>\${p.nombre}</td>
      <td class="\${p.stock <= p.stockMin ? 'text-danger fw-bold' : ''}">\${p.stock}</td>
      <td>\${p.stockMin}</td>
      <td>
        <button onclick="eliminarProducto(\${index})" class="btn btn-sm btn-outline-danger">🗑️</button>
      </td>
    \`;
    tbody.appendChild(fila);
  });
}

function eliminarProducto(index) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    productos.splice(index, 1);
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
    actualizarSelectorProductos();
    mostrarMensaje("Producto eliminado correctamente.", "warning");
  }
}

function limpiarFormulario() {
  document.getElementById("codigo").value = "";
  document.getElementById("nombre").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("stock-min").value = "";
}

function actualizarSelectorProductos() {
  const select = document.getElementById("producto-movimiento");
  select.innerHTML = '<option value="">Seleccione producto</option>';
  productos.forEach(p => {
    const option = document.createElement("option");
    option.value = p.codigo;
    option.textContent = \`\${p.nombre} (\${p.codigo})\`;
    select.appendChild(option);
  });
}

function registrarMovimiento() {
  const codigo = document.getElementById("producto-movimiento").value;
  const tipo = document.getElementById("tipo-movimiento").value;
  const cantidad = parseInt(document.getElementById("cantidad-movimiento").value);

  if (!codigo || !tipo || isNaN(cantidad) || cantidad <= 0) {
    mostrarMensaje("Completa correctamente todos los campos para registrar movimiento.", "danger");
    return;
  }

  const index = productos.findIndex(p => p.codigo === codigo);
  if (index === -1) {
    mostrarMensaje("Producto no encontrado.", "danger");
    return;
  }

  if (tipo === "salida" && productos[index].stock < cantidad) {
    mostrarMensaje("Stock insuficiente para salida.", "danger");
    return;
  }

  productos[index].stock += tipo === "ingreso" ? cantidad : -cantidad;

  const registro = {
    fecha: new Date().toLocaleString(),
    codigo,
    nombre: productos[index].nombre,
    tipo,
    cantidad
  };
  historial.push(registro);

  localStorage.setItem("productos", JSON.stringify(productos));
  localStorage.setItem("historial", JSON.stringify(historial));

  mostrarProductos();
  mostrarHistorial();
  document.getElementById("cantidad-movimiento").value = "";
  document.getElementById("producto-movimiento").value = "";
  mostrarMensaje("Movimiento registrado correctamente.");
}

function mostrarHistorial() {
  const lista = document.getElementById("lista-historial");
  lista.innerHTML = "";
  historial.slice().reverse().forEach(r => {
    const item = document.createElement("li");
    item.className = "list-group-item";
    item.textContent = \`\${r.fecha} - \${r.tipo.toUpperCase()} de \${r.cantidad} \${r.nombre} (\${r.codigo})\`;
    lista.appendChild(item);
  });
}

function filtrarProductos() {
  const valorBusqueda = document.getElementById("busqueda").value;
  mostrarProductos(valorBusqueda);
}

function exportarHistorialExcel() {
  if (historial.length === 0) {
    mostrarMensaje("No hay movimientos registrados para exportar.", "warning");
    return;
  }

  const hoja = historial.map(h => ({
    Fecha: h.fecha,
    Código: h.codigo,
    Producto: h.nombre,
    Tipo: h.tipo.toUpperCase(),
    Cantidad: h.cantidad
  }));

  const libro = XLSX.utils.book_new();
  const hojaExcel = XLSX.utils.json_to_sheet(hoja);
  XLSX.utils.book_append_sheet(libro, hojaExcel, "Historial");

  const nombreArchivo = \`Historial_Bodega_\${new Date().toISOString().slice(0,10)}.xlsx\`;
  XLSX.writeFile(libro, nombreArchivo);
  mostrarMensaje("Historial exportado a Excel correctamente.");
}
