function calcularTotal() {

    let producto = document.getElementById("producto").value;
    let cantidad = document.getElementById("cantidad").value;

    let total = producto * cantidad;

    document.getElementById("total").innerHTML =
        "Total: $" + total;
}


function realizarPedido() {

    let nombre = document.getElementById("nombre").value;
    let producto = document.getElementById("producto");
    let cantidad = document.getElementById("cantidad").value;

    let nombreProducto =
        producto.options[producto.selectedIndex].text;

    document.getElementById("mensaje").innerHTML =
        "Pedido realizado para " +
        nombre +
        ": " +
        cantidad +
        " " +
        nombreProducto;
}
