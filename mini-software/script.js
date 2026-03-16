const weatherCodes = {
    0: "Despejado ☀️",
    1: "Mayormente despejado 🌤️",
    2: "Parcialmente nublado ⛅",
    3: "Nublado ☁️",
    45: "Niebla 🌫️",
    48: "Niebla con escarcha 🌫️",
    51: "Llovizna ligera 🌦️",
    53: "Llovizna moderada 🌦️",
    55: "Llovizna intensa 🌧️",
    61: "Lluvia ligera 🌧️",
    63: "Lluvia moderada 🌧️",
    65: "Lluvia fuerte 🌧️",
    71: "Nieve ligera ❄️",
    73: "Nieve moderada ❄️",
    75: "Nieve fuerte ❄️",
    80: "Chubascos ligeros 🌦️",
    81: "Chubascos moderados 🌧️",
    82: "Chubascos fuertes ⛈️",
    95: "Tormenta ⛈️"
};

const weatherClassMap = {
    0: "weather-sunny",
    1: "weather-sunny",
    2: "weather-partly-cloudy",
    3: "weather-cloudy",
    45: "weather-fog",
    48: "weather-fog",
    51: "weather-rain",
    53: "weather-rain",
    55: "weather-rain",
    61: "weather-rain",
    63: "weather-rain",
    65: "weather-rain",
    71: "weather-snow",
    73: "weather-snow",
    75: "weather-snow",
    80: "weather-rain",
    81: "weather-rain",
    82: "weather-storm",
    95: "weather-thunderstorm"
};

async function obtenerClima(lat, lon, nombreLugar = "Tu ubicación") {
    try {

        mostrarLoading(true);
        ocultarError();

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error en la API");

        const data = await res.json();

        const now = data.current;
        const code = now.weather_code;

        const desc = weatherCodes[code] || `Código ${code}`;

        const newClass = weatherClassMap[code] || "weather-cloudy";
        document.body.className = newClass;

        document.getElementById("lugar").textContent = nombreLugar;
        document.getElementById("temp").textContent = Math.round(now.temperature_2m) + " °C";
        document.getElementById("desc").textContent = desc;
        document.getElementById("humedad").textContent = now.relative_humidity_2m + "%";
        document.getElementById("viento").textContent = Math.round(now.wind_speed_10m) + " km/h";
        document.getElementById("sensacion").textContent = Math.round(now.apparent_temperature) + " °C";
        document.getElementById("presion").textContent = Math.round(now.pressure_msl) + " hPa";

        const forecastDiv = document.getElementById("forecast");
        forecastDiv.innerHTML = "";

        for (let i = 1; i <= 6; i++) {

            const fecha = new Date(data.daily.time[i])
                .toLocaleDateString("es", { weekday: "short", day: "numeric" });

            const max = Math.round(data.daily.temperature_2m_max[i]);
            const min = Math.round(data.daily.temperature_2m_min[i]);

            const wCode = data.daily.weather_code[i];
            const wDesc = weatherCodes[wCode] || "";
            const emoji = wDesc.split(" ").pop() || "🌡️";

            const div = document.createElement("div");
            div.className = "day";

            div.innerHTML = `
                <strong>${fecha}</strong>
                <div class="emoji">${emoji}</div>
                <div>${max}° / ${min}°</div>
            `;

            forecastDiv.appendChild(div);
        }

        document.getElementById("resultado").classList.remove("hidden");

    } catch (err) {

        mostrarError("No se pudo obtener el clima: " + err.message);

    } finally {

        mostrarLoading(false);

    }
}

async function buscarCiudad() {

    const input = document.getElementById("cityInput").value.trim();

    if (!input) {
        mostrarError("Escribe una ciudad");
        return;
    }

    try {

        mostrarLoading(true);

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=1&language=es&format=json`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            mostrarError("Ciudad no encontrada");
            return;
        }

        const lugar = data.results[0];

        await obtenerClima(
            lugar.latitude,
            lugar.longitude,
            lugar.name + (lugar.admin1 ? ", " + lugar.admin1 : "")
        );

    } catch (err) {

        mostrarError("Error al buscar ciudad");

    } finally {

        mostrarLoading(false);

    }

}

function obtenerUbicacionActual() {

    if (!navigator.geolocation) {
        mostrarError("Tu navegador no soporta geolocalización");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        (pos) => {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            obtenerClima(lat, lon, "Tu ubicación");

        },

        () => {
            mostrarError("No diste permiso para la ubicación");
        }

    );

}

function mostrarLoading(mostrar) {
    document.getElementById("loading").classList.toggle("hidden", !mostrar);
}

function mostrarError(msg) {

    const el = document.getElementById("error");

    el.textContent = msg;
    el.classList.remove("hidden");

}

function ocultarError() {

    document.getElementById("error").classList.add("hidden");

}

window.addEventListener("load", () => {
    obtenerUbicacionActual();
});