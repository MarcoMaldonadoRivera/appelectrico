// API Key para OpenWeatherMap (necesita ser reemplazada por una real)
const API_KEY = 'demo_key'; // Reemplazar con una API key real
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Elementos del DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingDiv = document.getElementById('loading');
const weatherResult = document.getElementById('weatherResult');
const errorDiv = document.getElementById('error');

// Elementos de datos del clima
const cityName = document.getElementById('cityName');
const country = document.getElementById('country');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const weatherIcon = document.getElementById('weatherIcon');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const windSpeed = document.getElementById('windSpeed');
const visibility = document.getElementById('visibility');
const tempMin = document.getElementById('tempMin');
const tempMax = document.getElementById('tempMax');
const errorText = document.getElementById('errorText');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
locationBtn.addEventListener('click', handleLocationSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Función para mostrar estado de carga
function showLoading() {
    hideAll();
    loadingDiv.classList.remove('hidden');
}

// Función para ocultar todos los elementos
function hideAll() {
    loadingDiv.classList.add('hidden');
    weatherResult.classList.add('hidden');
    errorDiv.classList.add('hidden');
}

// Función para mostrar error
function showError(message) {
    hideAll();
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Función para mostrar resultados del clima
function showWeatherResult(data) {
    hideAll();
    
    // Información básica
    cityName.textContent = data.name;
    country.textContent = data.sys.country;
    
    // Temperatura
    temperature.textContent = Math.round(data.main.temp);
    feelsLike.textContent = Math.round(data.main.feels_like);
    tempMin.textContent = Math.round(data.main.temp_min);
    tempMax.textContent = Math.round(data.main.temp_max);
    
    // Descripción e icono del clima
    description.textContent = data.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    // Información adicional
    humidity.textContent = data.main.humidity;
    pressure.textContent = data.main.pressure;
    windSpeed.textContent = Math.round(data.wind.speed * 3.6); // Convertir m/s a km/h
    visibility.textContent = data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A';
    
    weatherResult.classList.remove('hidden');
}

// Función para obtener datos del clima por ciudad
async function getWeatherByCity(city) {
    try {
        showLoading();
        
        // Para demo, usar datos simulados si no hay API key válida
        if (API_KEY === 'demo_key') {
            return await getSimulatedWeatherData(city);
        }
        
        const response = await fetch(
            `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Ciudad no encontrada. Por favor, verifica el nombre e intenta nuevamente.');
            } else if (response.status === 401) {
                throw new Error('Error de API. Por favor, verifica la configuración.');
            } else {
                throw new Error('Error al obtener datos del clima. Intenta nuevamente.');
            }
        }
        
        const data = await response.json();
        showWeatherResult(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// Función para obtener datos del clima por coordenadas
async function getWeatherByCoordinates(lat, lon) {
    try {
        showLoading();
        
        // Para demo, usar datos simulados si no hay API key válida
        if (API_KEY === 'demo_key') {
            return await getSimulatedWeatherData('Tu ubicación');
        }
        
        const response = await fetch(
            `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
        );
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del clima para tu ubicación.');
        }
        
        const data = await response.json();
        showWeatherResult(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// Función para simular datos del clima (para demo)
async function getSimulatedWeatherData(cityName) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const simulatedData = {
                name: cityName === 'Tu ubicación' ? 'Ciudad Demo' : cityName,
                sys: { country: 'XX' },
                main: {
                    temp: Math.round(Math.random() * 30 + 5), // 5-35°C
                    feels_like: Math.round(Math.random() * 30 + 5),
                    temp_min: Math.round(Math.random() * 25 + 0),
                    temp_max: Math.round(Math.random() * 35 + 10),
                    humidity: Math.round(Math.random() * 40 + 40), // 40-80%
                    pressure: Math.round(Math.random() * 50 + 1000) // 1000-1050 hPa
                },
                weather: [{
                    description: 'Parcialmente nublado',
                    icon: '02d'
                }],
                wind: {
                    speed: Math.random() * 10 + 2 // 2-12 m/s
                },
                visibility: Math.round(Math.random() * 5000 + 5000) // 5-10 km
            };
            
            showWeatherResult(simulatedData);
        }, 1500); // Simular delay de red
    });
}

// Manejar búsqueda por ciudad
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Por favor, ingresa el nombre de una ciudad.');
        return;
    }
    
    getWeatherByCity(city);
}

// Manejar búsqueda por ubicación
function handleLocationSearch() {
    if (!navigator.geolocation) {
        showError('La geolocalización no está soportada en este navegador.');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            let errorMessage = 'Error al obtener tu ubicación.';
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Información de ubicación no disponible.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Tiempo de espera agotado al obtener la ubicación.';
                    break;
            }
            
            showError(errorMessage);
        },
        {
            timeout: 10000,
            enableHighAccuracy: true
        }
    );
}

// Mostrar mensaje inicial sobre la demo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌡️ App de Temperatura cargada');
    console.log('📝 Nota: Esta es una versión demo. Para obtener datos reales del clima, necesitas:');
    console.log('1. Registrarte en https://openweathermap.org/api');
    console.log('2. Obtener una API key gratuita');
    console.log('3. Reemplazar "demo_key" en script.js con tu API key real');
});

// Función adicional para convertir temperaturas
function convertTemperature(temp, unit) {
    if (unit === 'F') {
        return Math.round((temp * 9/5) + 32);
    } else if (unit === 'K') {
        return Math.round(temp + 273.15);
    }
    return Math.round(temp);
}

// Función para formatear viento
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}