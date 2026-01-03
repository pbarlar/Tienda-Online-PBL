const users = [];
/**
 * Obtiene los usuarios de la API
 */
function getUsers() {
    fetch('https://dummyjson.com/users')
        .then(response => response.json())
        .then(data => users.push(...data.users))
        .catch(error => console.error(error));
}

let generatedCaptcha = '';

/**
 * Genera un captcha aleatorio
 * @returns {string} captcha aleatorio
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
 * Comprueba si el usuario introducido es correcto
 * Si es correcto, muestra el captcha
 * Si es incorrecto, muestra un mensaje de error
 */
function comprobarUsuario(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        console.log('Credenciales correctas, mostrando captcha');

        // Hide form, show captcha
        document.getElementById('form').classList.add('hidden');
        const captchaContainer = document.getElementById('captcha-container');
        captchaContainer.classList.remove('hidden');

        // Generate and display captcha
        generatedCaptcha = generateCaptcha();
        document.getElementById('captcha-display').textContent = generatedCaptcha;

        // Save user to local storage temporarily (or just when captcha is verified?)
        // Let's keep the original logic of setting it on success, but here purely for credential success
        localStorage.setItem('user', JSON.stringify(user));

    } else {
        alert('Login incorrecto');
    }
}

/**
 * Verifica el captcha introducido por el usuario
 * Si es correcto, redirige al usuario a la página de inicio
 * Si es incorrecto, muestra un mensaje de error y genera un nuevo captcha
 */
function verificarCaptcha() {
    const input = document.getElementById('captcha-input').value;
    if (input === generatedCaptcha) {
        console.log('Captcha correcto');
        window.location.href = '../index.html';
    } else {
        alert('Captcha incorrecto. Inténtalo de nuevo.');
        generatedCaptcha = generateCaptcha();
        document.getElementById('captcha-display').textContent = generatedCaptcha;
        document.getElementById('captcha-input').value = '';
    }
}

/**
 * Función principal que se ejecuta al cargar la página
 * Carga los usuarios al iniciar
 * Añade un listener al formulario
 * Añade un listener al botón de verificar captcha
 */
const main = () => {
    getUsers(); // Carga usuarios al iniciar
    const form = document.getElementById('form'); // Obtiene el formulario
    form.addEventListener('submit', event => comprobarUsuario(event)); // Añade un listener al formulario

    document.getElementById('verify-captcha').addEventListener('click', verificarCaptcha); // Añade un listener al botón de verificar captcha
}

document.addEventListener('DOMContentLoaded', main); // Añade un listener al DOM