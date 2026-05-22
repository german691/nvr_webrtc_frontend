import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cameraApi } from "../../api/camera.api";

// Acción Asíncrona: Traer la lista dinámica de cámaras
export const fetchCameras = createAsyncThunk(
  "cameras/fetchCameras",
  async (_, { rejectWithValue }) => {
    try {
      return await cameraApi.getCameras();
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Acción Asíncrona: Encender, apagar o cambiar calidad
export const toggleStream = createAsyncThunk(
  "cameras/toggleStream",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cameraApi.controlStream(payload);
      // Devolvemos el payload enviado y la respuesta para inyectar la URL en el estado local
      return { request: payload, response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const cameraSlice = createSlice({
  name: "cameras",
  initialState: {
    list: [], // Contiene el estado reportado por las Mini-PCs
    isLoading: false, // Loader global de sincronización
    error: null,
  },
  reducers: {
    // Aquí podremos meter un reducer para ordenar el layout localmente
  },
  extraReducers: (builder) => {
    builder
      // ---- FETCH CAMERAS ----
      .addCase(fetchCameras.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCameras.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload; // [{ dev, name, modes, streaming, webrtc_url, ... }]
      })
      .addCase(fetchCameras.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ---- TOGGLE STREAM ----
      .addCase(toggleStream.fulfilled, (state, action) => {
        const { dev, action: streamAction } = action.payload.request;
        const { webrtc_url, active_settings } = action.payload.response;

        // Buscamos la cámara que acabamos de afectar y actualizamos su info sin recargar toda la lista
        const camera = state.list.find((c) => c.dev === dev);
        if (camera) {
          if (streamAction === "stop") {
            camera.streaming = false;
            camera.webrtc_url = null;
            camera.active_settings = null;
          } else {
            camera.streaming = true;
            camera.webrtc_url = webrtc_url;
            camera.active_settings = active_settings;
          }
        }
      });
  },
});

export default cameraSlice.reducer;
