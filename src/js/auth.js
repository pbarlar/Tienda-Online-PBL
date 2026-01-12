
/**
 * auth.js
 * Gestiona la autenticación del usuario en el frontend.
 * - Verifica si el usuario está logueado (localStorage).
 * - Protege las rutas redirigiendo a login si no hay sesión.
 * - Gestiona el botón de Login/Logout en el navbar.
 */

(function () {
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname;

    // 1. Protección de Rutas
    // Si no hay usuario y NO estamos en la página de login, redirigir.
    if (!user && !currentPage.includes('login.html')) {
        // Detectar profundidad para redirigir correctamente
        // Si estamos en raiz (index.html) ir a src/login/login.html ?? No, index está en src/
        // Estructura:
        // src/index.html
        // src/login/login.html
        // src/collection/collection.html

        // Mejor aproximación: Usar rutas relativas basadas en dónde estamos
        // Si estamos en collection/ o about/ -> ../login/login.html
        // Si estamos en raiz -> login/login.html

        if (currentPage.includes('/collection/') || currentPage.includes('/about/')) {
            window.location.href = '../login/login.html';
        } else {
            // Asumimos raiz (index.html)
            window.location.href = 'login/login.html';
        }
        return; // Detener ejecución
    }

    // 2. Gestión de Navbar (Logout)
    document.addEventListener('DOMContentLoaded', () => {
        const navbarLinks = document.querySelectorAll('.navbar__link');
        let loginLink = null;

        // Buscar el link que dice "Login" o apunta a login.html
        navbarLinks.forEach(link => {
            if (link.textContent.trim().toLowerCase() === 'login' || link.href.includes('login.html')) {
                loginLink = link;
            }
        });

        if (user && loginLink) {
            // Cambiar texto a "Cerrar Sesión"
            loginLink.textContent = 'Cerrar Sesión';
            loginLink.href = '#'; // Evitar navegación por defecto

            // Añadir evento de Logout
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });

    /**
     * Cierra la sesión del usuario.
     * Elimina datos de localStorage y redirige a login.
     */
    function logout() {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('lumina_cart'); // Opcional: limpiar carrito al salir

            // Redirigir a login
            if (currentPage.includes('/collection/') || currentPage.includes('/about/')) {
                window.location.href = '../login/login.html';
            } else {
                window.location.href = 'login/login.html';
            }
        }
    }

})();
