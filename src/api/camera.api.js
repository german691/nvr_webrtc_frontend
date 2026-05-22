import axios from "axios";

// Utiliza la variable de entorno de Vite o asume proxy local
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const cameraApi = {
  // Obtiene el arreglo unificado de cámaras desde el Orquestador
  getCameras: async () => {
    const response = await axios.get(`${API_BASE_URL}/cameras`);
    return response.data;
  },

  // Inicia, modifica o detiene un stream
  // payload: { dev: "/dev/videoX", resolution: "1920x1080", fps: 30, cleanBitrate: "2M", action: "start" | "stop" }
  controlStream: async (payload) => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/stream`,
      payload,
    );
    return response.data;
  },

  // Obtiene el orden de las cámaras y alias (si implementas personalización)
  getConfig: async () => {
    const response = await axios.get(`${API_BASE_URL}/config`);
    return response.data;
  },

  // Actualiza preferencias del usuario
  updateConfig: async (configPayload) => {
    const response = await axios.put(`${API_BASE_URL}/config`, configPayload);
    return response.data;
  },

  // Obtiene los controles nativos soportados por una cámara
  getControls: async (dev) => {
    const response = await axios.get(`${API_BASE_URL}/cameras/controls`, {
      params: { dev },
    });
    return response.data;
  },

  // Envía la orden de modificar un valor (Brillo, Contraste, etc.)
  setControl: async (payload) => {
    // payload: { dev: "/dev/video0", controlName: "brightness", value: 150 }
    const response = await axios.post(
      `${API_BASE_URL}/cameras/controls`,
      payload,
    );
    return response.data;
  },

  // Consulta el estado de los flujos de captura FFmpeg activos y su consumo
  getFfmpegDebug: async () => {
    const response = await axios.get(`${API_BASE_URL}/cameras/debug/ffmpeg`);
    return response.data;
  },

  // Finaliza un proceso de stream específico por su PID
  killFfmpegProcess: async (pid) => {
    const response = await axios.post(`${API_BASE_URL}/cameras/debug/ffmpeg/kill`, { pid });
    return response.data;
  },

  // Finaliza todas las transmisiones activas
  killAllFfmpegProcesses: async () => {
    const response = await axios.post(`${API_BASE_URL}/cameras/debug/ffmpeg/kill-all`);
    return response.data;
  },
};

