(function(){
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let historial = JSON.parse(localStorage.getItem("historial")) || [];

document.addEventListener("DOMContentLoaded", () => {
  mostrarProductos();
  mostrarHistorial();
  actualizarSelectorProductos();
});

function agregarProducto() {
  const codigo = document.getElementById("codigo").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const stock = parseInt(document.getElementById("stock").value);
  const stockMin = parseInt(document.getElementById("stock-min").value);

  if (!codigo || !nombre || isNaN(stock) || isNaN(stockMin)) {
    alert("Completa todos los campos correctamente.");
    return;
  }

  if (productos.some(p => p.codigo === codigo)) {
    alert("Ya existe un producto con ese código.");
    return;
  }

  const nuevoProducto = { codigo, nombre, stock, stockMin };
  productos.push(nuevoProducto);
  localStorage.setItem("productos", JSON.stringify(productos));
  mostrarProductos();
  actualizarSelectorProductos();
  limpiarFormulario();
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
    alert("Completa correctamente todos los campos.");
    return;
  }

  const index = productos.findIndex(p => p.codigo === codigo);
  if (index === -1) {
    alert("Producto no encontrado.");
    return;
  }

  if (tipo === "salida" && productos[index].stock < cantidad) {
    alert("Stock insuficiente.");
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
    alert("No hay movimientos registrados para exportar.");
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
}
})();
