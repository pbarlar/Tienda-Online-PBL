/**
 * Variable para almacenar el captcha generado actual para su validación.
 * @type {string}
 */
let generatedCaptcha = '';

/**
 * Genera un código captcha aleatorio de 5 caracteres.
 * Utiliza letras mayúsculas y minúsculas.
 * 
 * @returns {string} El código captcha generado.
 */
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let captcha = '';
    for (let i = 0; i < 5; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

/**
 * Simula la generación de un token JWT.
 * Crea una cadena codificada en base64 combinando usuario y timestamp.
 * 
 * @param {object} user - El objeto de usuario validado.
 * @returns {string} Token simulado.
 */
function simularTokenJWT(user) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
        sub: user.id,
        username: user.username,
        iat: Date.now(),
        exp: Date.now() + (60 * 60 * 1000) // 1 hora expiración sim
    }));
    const signature = btoa("firma_secreta_simulada"); // Firma falsa
    return `${header}.${payload}.${signature}`;
}

/**
 * Maneja el evento de envío del formulario de login.
 * Realiza una petición GET a la API de dummyjson.com para obtener usuarios.
 * Valida las credenciales localmente (simulación solicitada).
 * 
 * @param {Event} event - El evento de submit del formulario.
 */
function comprobarUsuario(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Usamos GET para obtener usuarios y validar localmente
    fetch('https://dummyjson.com/users?limit=100') // Traemos 100 para asegurar encontrar al usuario
        .then(res => res.json())
        .then(data => {
            const users = data.users;
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                console.log('Credenciales válidas:', user);

                // Generar token simulado
                const token = simularTokenJWT(user);

                // Guardar en localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);

                // Ocultar formulario y mostrar captcha
                const form = document.querySelector('.login__form') || document.getElementById('form'); // Soporte para BEM o ID
                if (form) form.classList.add('hidden');

                const captchaContainer = document.getElementById('captcha-container');
                captchaContainer.classList.remove('hidden');
                // Añadir clase de animación de entrada si existe
                captchaContainer.classList.add('fade-in');

                // Generar y mostrar el primer captcha
                generatedCaptcha = generateCaptcha();
                document.getElementById('captcha-display').textContent = generatedCaptcha;

            } else {
                throw new Error('Credenciales incorrectas');
            }
        })
        .catch(error => {
            console.error('Error en login:', error);
            alert('Login incorrecto: Usuario o contraseña no válidos.');
            passwordInput.value = '';
        });
}

/**
 * Verifica si el captcha introducido coincide con el generado.
 * Si es correcto, redirige a la página principal.
 * Si es incorrecto, alerta al usuario y genera un nuevo captcha.
 */
function verificarCaptcha() {
    const input = document.getElementById('captcha-input').value;
    if (input === generatedCaptcha) {
        console.log('Captcha correcto');
        // Redirección a la página principal de la tienda
        window.location.href = '../index.html';
    } else {
        alert('Captcha incorrecto. Inténtalo de nuevo.');
        generatedCaptcha = generateCaptcha();
        document.getElementById('captcha-display').textContent = generatedCaptcha;
        document.getElementById('captcha-input').value = '';
    }
}

/**
 * Función de inicialización principal.
 * Configura los listeners de eventos cuando el DOM está listo.
 */
const main = () => {
    const form = document.getElementById('form');
    if (form) {
        form.addEventListener('submit', comprobarUsuario);
    }

    const verifyButton = document.getElementById('verify-captcha');
    if (verifyButton) {
        verifyButton.addEventListener('click', verificarCaptcha);
    }
}

// Ejecutar main cuando el contenido del DOM haya sido cargado
document.addEventListener('DOMContentLoaded', main);