import axios from "axios";
import L from "leaflet";

const API_KEY = import.meta.env.VITE_API_KEY;
const form = document.querySelector("form") as HTMLFormElement;
const cidadeInput = document.getElementById("cidade") as HTMLInputElement;

type GeocodeResponse = {
    lat: number;
    lon: number;
}[];

let mapa: L.Map | null = null;

async function obterNomeCidade(lat: number, lon: number): Promise<string> {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
        return response.data[0]?.name || "Local desconhecido";
    } catch (error) {
        console.error("Erro ao obter nome da cidade:", error);
        return "Local desconhecido";
    }
}

function obterLocalizacaoUsuario(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalização não suportada pelo navegador"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
}

async function inicializarMapa() {
    try {
        const posicao = await obterLocalizacaoUsuario();
        const { lat, lon } = posicao;

        mapa = L.map("mapa").setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
            mapa
        );

        const nomeCidade = await obterNomeCidade(lat, lon);

        L.marker([lat, lon]).addTo(mapa).bindPopup(`${nomeCidade}`).openPopup();
    } catch (error) {
        console.error("Erro:", error);
        mapa = L.map("mapa").setView([-23.5505, -46.6333], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
            mapa
        );

        L.marker([-23.5505, -46.6333])
            .addTo(mapa)
            .bindPopup("<b>Local padrão:</b><br>São Paulo")
            .openPopup();
    }
}

async function procurarEndereço(e: Event) {
    e.preventDefault();
    const cidadeDigitada = cidadeInput.value.trim();

    if (!cidadeDigitada) return;

    try {
        const res = await axios.get<GeocodeResponse>(
            `https://api.openweathermap.org/geo/1.0/direct?q=${cidadeDigitada}&limit=1&appid=${API_KEY}`
        );

        if (!res.data.length) throw new Error("Cidade não encontrada");

        const { lat, lon } = res.data[0];

        if (!mapa) {
            mapa = L.map("mapa").setView([lat, lon], 13);
            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ).addTo(mapa);
            setTimeout(() => mapa?.invalidateSize(), 0);
        } else {
            mapa.setView([lat, lon], 13);
        }

        L.marker([lat, lon]).addTo(mapa).bindPopup(cidadeDigitada).openPopup();
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar cidade. Tente novamente.");
    }
}

document.addEventListener("DOMContentLoaded", inicializarMapa);
form.addEventListener("submit", procurarEndereço);
