import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cameraApi } from "../../api/camera.api";

export const fetchCamerasForNode = createAsyncThunk(
  "cameras/fetchCamerasForNode",
  async (nodeIp, { rejectWithValue }) => {
    try {
      const cameras = await cameraApi.getCameras({ nodeIp });
      return { nodeIp, cameras };
    } catch (error) {
      return rejectWithValue({
        nodeIp,
        error:
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.message,
      });
    }
  },
);

export const fetchCameras = createAsyncThunk(
  "cameras/fetchCameras",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const nodes = await cameraApi.getCameras();
      if (Array.isArray(nodes)) {
        nodes.forEach((node) => {
          dispatch(fetchCamerasForNode(node.ip));
        });
      }
      return nodes;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const toggleStream = createAsyncThunk(
  "cameras/toggleStream",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cameraApi.controlStream(payload);
      return { request: payload, response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const cameraSlice = createSlice({
  name: "cameras",
  initialState: {
    list: [],
    isLoading: false,
    error: null,
    activePtzOverlays: {},
  },
  reducers: {
    togglePtzOverlay: (state, action) => {
      const dev = action.payload;
      state.activePtzOverlays[dev] = !state.activePtzOverlays[dev];
    },
    setPtzOverlay: (state, action) => {
      const { dev, open } = action.payload;
      state.activePtzOverlays[dev] = !!open;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCameras.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCameras.fulfilled, (state, action) => {
        state.isLoading = false;
        // Inyectamos placeholders de carga por cada nodo
        state.list = action.payload.map((node) => ({
          dev: `loading:${node.ip}`,
          name: `Cargando ${node.label || "Nodo"} (${node.ip})...`,
          loading: true,
          nodeIp: node.ip,
          nodeLabel: node.label,
          modes: [],
          streaming: false,
        }));
      })
      .addCase(fetchCameras.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCamerasForNode.pending, (state, action) => {
        const nodeIp = action.meta.arg;
        state.list = state.list.filter(
          (c) =>
            c.dev !== `loading:${nodeIp}` &&
            c.dev !== `offline:${nodeIp}` &&
            !c.dev.startsWith(`${nodeIp}:`),
        );
        state.list.push({
          dev: `loading:${nodeIp}`,
          name: `Cargando cámaras en (${nodeIp})...`,
          loading: true,
          nodeIp: nodeIp,
          modes: [],
          streaming: false,
        });
      })
      .addCase(fetchCamerasForNode.fulfilled, (state, action) => {
        const { nodeIp, cameras } = action.payload;
        state.list = state.list.filter(
          (c) =>
            c.dev !== `loading:${nodeIp}` &&
            c.dev !== `offline:${nodeIp}` &&
            !c.dev.startsWith(`${nodeIp}:`),
        );
        state.list.push(...cameras);
      })
      .addCase(fetchCamerasForNode.rejected, (state, action) => {
        const nodeIp = action.meta.arg;
        const { error } = action.payload || {};
        state.list = state.list.filter(
          (c) =>
            c.dev !== `loading:${nodeIp}` &&
            c.dev !== `offline:${nodeIp}` &&
            !c.dev.startsWith(`${nodeIp}:`),
        );
        state.list.push({
          dev: `offline:${nodeIp}`,
          name: `⚠️ Nodo fuera de línea (${nodeIp})`,
          modes: [],
          streaming: false,
          webrtc_url: null,
          offline: true,
          error: error || "Timeout o error de conexión",
        });
      })
      .addCase(toggleStream.fulfilled, (state, action) => {
        const { dev, action: streamAction } = action.payload.request;
        const { webrtc_url, active_settings } = action.payload.response;

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

export const { togglePtzOverlay, setPtzOverlay } = cameraSlice.actions;

export default cameraSlice.reducer;
