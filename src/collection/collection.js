// collection.js

/**
 * URL base de la API de DummyJSON para obtener productos.
 * @const {string}
 */
const API_URL = 'https://dummyjson.com/products';

/**
 * Variables de estado para la paginación y filtrado.
 */
let products = []; // Caché local de productos
let limit = 8;
let skip = 0;
let totalProducts = 0;
let isLoading = false;
let currentCategory = 'all';
let currentSort = 'default';

/**
 * Estado del carrito de compras.
 * @type {Array<object>}
 */
let cart = [];

// Elementos del DOM (Declaración inicial, se asignan en main)
let productGrid, loader, endMessage, categorySelect, sortSelect;
let modal, modalBody, closeModal;
let cartSidebar, cartOverlay, cartBtn, closeCartBtn, cartItemsContainer, cartTotalPriceEl, cartCountEl, checkoutBtn;

/**
 * Carga las categorías desde la API y rellena el select de filtros.
 * Muestra las opciones en el elemento select del DOM.
 */
async function cargarCategorias() {
    try {
        const res = await fetch('https://dummyjson.com/products/categories');
        const categories = await res.json();

        categories.forEach(cat => {
            const option = document.createElement('option');
            // La API puede devolver objetos o strings
            const value = typeof cat === 'string' ? cat : cat.slug;
            const label = typeof cat === 'string' ? cat : cat.name;

            option.value = value;
            option.textContent = label.charAt(0).toUpperCase() + label.slice(1);
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

/**
 * Obtiene los productos de la API basándose en los filtros y paginación actuales.
 * Gestiona el estado de carga y muestra/oculta el loader.
 */
async function obtenerProductos() {
    if (isLoading) return;
    isLoading = true;
    if (loader) loader.classList.add('show');

    try {
        let url = `${API_URL}`;
        let params = `?limit=${limit}&skip=${skip}&select=title,price,thumbnail,category,description,images,brand,rating,stock`;

        // Construir URL basada en la categoría seleccionada
        if (currentCategory !== 'all') {
            url = `${API_URL}/category/${currentCategory}`;
        }

        // Gestión de la ordenación
        if (currentSort !== 'default') {
            const [sortBy, order] = currentSort.split('-');
            params += `&sortBy=${sortBy}&order=${order}`;
        }

        const fullUrl = `${url}${params}`;

        const res = await fetch(fullUrl);
        const data = await res.json();

        const newProducts = data.products;
        totalProducts = data.total;

        if (newProducts.length === 0) {
            if (endMessage) endMessage.classList.remove('hidden');
        } else {
            renderizarProductos(newProducts);
            skip += limit;
        }

        // Comprobar si hemos llegado al final
        if (skip >= totalProducts && totalProducts > 0) {
            if (endMessage) endMessage.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error obteniendo productos:', error);
    } finally {
        isLoading = false;
        if (loader) loader.classList.remove('show');
    }
}

/**
 * Genera el HTML para cada producto y lo añade al grid.
 * Configura los eventos de click para ver detalles y añadir al carrito.
 * 
 * @param {Array<object>} productosParaRenderizar - Lista de productos a mostrar.
 */
function renderizarProductos(productosParaRenderizar) {
    productosParaRenderizar.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.dataset.id = product.id;

        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.thumbnail}" alt="${product.title}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">$${product.price}</div>
                <button class="add-to-cart-btn" data-id="${product.id}">Añadir al Carrito</button>
            </div>
        `;

        // Evento para ver detalles (evitando el botón de añadir)
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                mostrarDetallesProducto(product);
            }
        });

        // Evento para añadir al carrito
        const addBtn = card.querySelector('.add-to-cart-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            agregarAlCarrito(product);
        });

        productGrid.appendChild(card);
    });
}

/**
 * Muestra el modal con los detalles completos del producto.
 * 
 * @param {object} product - El objeto producto a mostrar.
 */
function mostrarDetallesProducto(product) {
    modalBody.innerHTML = `
        <div class="product-detail">
            <div class="detail-image">
                 <img src="${product.images[0] || product.thumbnail}" alt="${product.title}">
            </div>
            <div class="detail-info">
                <h2 class="detail-title">${product.title}</h2>
                <div class="detail-meta">Marca: ${product.brand || 'N/A'} | Valoración: ${product.rating} ★ | Stock: ${product.stock}</div>
                <p class="detail-description">${product.description}</p>
                <div class="detail-price">$${product.price}</div>
                <button class="add-to-cart-btn" id="modal-add-btn">Añadir al Carrito</button>
            </div>
        </div>
    `;

    // Botón de añadir dentro del modal
    document.getElementById('modal-add-btn').addEventListener('click', () => {
        agregarAlCarrito(product);
        modal.style.display = 'none';
    });

    modal.style.display = 'block';
}

/**
 * Resetea el grid de productos y el estado de paginación.
 * Se llama al cambiar filtros u ordenación.
 */
function resetearGrid() {
    productGrid.innerHTML = '';
    skip = 0;
    totalProducts = 0;
    products = [];
    if (endMessage) endMessage.classList.add('hidden');
}

/**
 * Configura el IntersectionObserver para implementar el Scroll Infinito.
 * Observa un elemento centinela invisible al final de la lista.
 */
function configurarScrollInfinito() {
    const sentinel = document.getElementById('sentinel');

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            if (skip < totalProducts || totalProducts === 0) {
                if (totalProducts === 0 && skip === 0) return;
                obtenerProductos();
            }
        }
    }, {
        rootMargin: '200px',
    });

    if (sentinel) {
        observer.observe(sentinel);
    }
}

// --- Lógica del Carrito ---

/**
 * Carga el carrito desde localStorage.
 */
function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('lumina_cart');
    if (carritoGuardado) {
        cart = JSON.parse(carritoGuardado);
    }
    actualizarInterfazCarrito();
}

/**
 * Guarda el carrito actual en localStorage.
 */
function guardarCarrito() {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
    actualizarInterfazCarrito();
}

/**
 * Añade un producto al carrito o incrementa su cantidad si ya existe.
 * 
 * @param {object} product - El producto a añadir.
 */
function agregarAlCarrito(product) {
    const itemExistente = cart.find(item => item.id === product.id);

    if (itemExistente) {
        itemExistente.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1
        });
    }

    guardarCarrito();
    abrirCarrito();
}

/**
 * Elimina un producto del carrito por su ID.
 * 
 * @param {number} id - El ID del producto a eliminar.
 */
function eliminarDelCarrito(id) {
    cart = cart.filter(item => item.id !== id);
    guardarCarrito();
}

/**
 * Actualiza la cantidad de un producto en el carrito.
 * Si la cantidad llega a 0, elimina el producto.
 * 
 * @param {number} id - El ID del producto.
 * @param {number} delta - El cambio en la cantidad (+1 o -1).
 */
function actualizarCantidad(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            eliminarDelCarrito(id);
        } else {
            guardarCarrito();
        }
    }
}

/**
 * Vacía el carrito por completo.
 */
function vaciarCarrito() {
    cart = [];
    guardarCarrito();
}

/**
 * Abre el sidebar del carrito.
 */
function abrirCarrito() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
}

/**
 * Cierra el sidebar del carrito.
 */
function cerrarCarrito() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
}

/**
 * Actualiza la interfaz gráfica del carrito (lista, total y contador).
 * Asigna de nuevo los eventos a los botones generados dinámicamente.
 */
function actualizarInterfazCarrito() {
    // 1. Actualizar contador
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalCount;

    // 2. Actualizar lista visual
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
    } else {
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <span class="cart-item-title">${item.title}</span>
                    <span class="cart-item-price">$${item.price}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                        <button class="remove-btn" data-id="${item.id}">Eliminar</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }

    // 3. Actualizar Precio Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPriceEl.textContent = `$${total.toFixed(2)}`;

    // 4. Asignar listeners a los nuevos botones
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => actualizarCantidad(parseInt(btn.dataset.id), 1));
    });
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => actualizarCantidad(parseInt(btn.dataset.id), -1));
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => eliminarDelCarrito(parseInt(btn.dataset.id)));
    });
}

/**
 * Función principal de inicialización.
 * Captura referencias al DOM y configura listeners y carga inicial.
 */
const main = () => {
    // Referencias al DOM
    productGrid = document.getElementById('product-grid');
    loader = document.getElementById('loader');
    endMessage = document.getElementById('end-message');
    categorySelect = document.getElementById('category-select');
    sortSelect = document.getElementById('sort-select');

    modal = document.getElementById('product-modal');
    modalBody = document.getElementById('modal-body');
    closeModal = document.querySelector('.close-modal');

    cartSidebar = document.getElementById('cart-sidebar');
    cartOverlay = document.getElementById('cart-overlay');
    cartBtn = document.getElementById('cart-btn');
    closeCartBtn = document.getElementById('close-cart');
    cartItemsContainer = document.getElementById('cart-items');
    cartTotalPriceEl = document.getElementById('cart-total-price');
    cartCountEl = document.getElementById('cart-count');
    checkoutBtn = document.getElementById('checkout-btn');

    // Carga inicial
    cargarCarrito();
    cargarCategorias();
    obtenerProductos();
    configurarScrollInfinito();

    // Listeners Globales
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            resetearGrid();
            obtenerProductos();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            resetearGrid();
            obtenerProductos();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirCarrito();
        });
    }

    if (closeCartBtn) closeCartBtn.addEventListener('click', cerrarCarrito);
    if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío.');
                return;
            }
            alert('¡Gracias por tu compra! (Simulación finalizada)');
            vaciarCarrito();
            cerrarCarrito();
        });
    }
}

// Ejecutar main cuando el contenido del DOM haya sido cargado
document.addEventListener('DOMContentLoaded', main);
