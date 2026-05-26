import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const currentHost = window.location.hostname;
    // Si estamos accediendo desde otra máquina en la red local
    if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
        return envUrl.replace(/localhost|127\.0\.0\.1/, currentHost);
      }
    }
  }
  return envUrl || "/api";
};

const API_BASE_URL = getApiBaseUrl();

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nvr_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = localStorage.getItem("nvr_token");
      localStorage.removeItem("nvr_token");
      if (hadToken) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);

export const cameraApi = {
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password,
    });
    return response.data;
  },

  changePassword: async (newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
      newPassword,
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  },

  createUser: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/users`, payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, payload);
    return response.data;
  },

  changeUserPassword: async (id, password) => {
    const response = await axios.put(`${API_BASE_URL}/users/${id}/password`, {
      password,
    });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
    return response.data;
  },

  getCameras: async (params) => {
    const response = await axios.get(`${API_BASE_URL}/cameras`, { params });
    return response.data;
  },

  controlStream: async (payload) => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/stream`,
      payload,
    );
    return response.data;
  },

  getConfig: async () => {
    const response = await axios.get(`${API_BASE_URL}/config`);
    return response.data;
  },

  getDebugModeStatus: async () => {
    const response = await axios.get(`${API_BASE_URL}/debug-mode`);
    return response.data;
  },

  updateConfig: async (configPayload) => {
    const response = await axios.put(`${API_BASE_URL}/config`, configPayload);
    return response.data;
  },

  getControls: async (dev) => {
    const response = await axios.get(`${API_BASE_URL}/cameras/controls`, {
      params: { dev },
    });
    return response.data;
  },

  setControl: async (payload) => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/controls`,
      payload,
    );
    return response.data;
  },

  getFfmpegDebug: async () => {
    const response = await axios.get(`${API_BASE_URL}/cameras/debug/ffmpeg`);
    return response.data;
  },

  killFfmpegProcess: async (pid) => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/debug/ffmpeg/kill`,
      { pid },
    );
    return response.data;
  },

  killAllFfmpegProcesses: async () => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/debug/ffmpeg/kill-all`,
    );
    return response.data;
  },

  getLayouts: async () => {
    const response = await axios.get(`${API_BASE_URL}/cameras/layouts`);
    return response.data;
  },

  createLayout: async (payload) => {
    const response = await axios.post(
      `${API_BASE_URL}/cameras/layouts`,
      payload,
    );
    return response.data;
  },

  deleteLayout: async (id) => {
    const response = await axios.delete(
      `${API_BASE_URL}/cameras/layouts/${id}`,
    );
    return response.data;
  },

  getNodes: async () => {
    const response = await axios.get(`${API_BASE_URL}/nodes`);
    return response.data;
  },

  createNode: async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/nodes`, payload);
    return response.data;
  },

  updateNode: async (id, payload) => {
    const response = await axios.put(`${API_BASE_URL}/nodes/${id}`, payload);
    return response.data;
  },

  deleteNode: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/nodes/${id}`);
    return response.data;
  },
};
