import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cameraApi } from "../../api/camera.api";

export const fetchLayouts = createAsyncThunk(
  "layouts/fetchLayouts",
  async (_, { rejectWithValue }) => {
    try {
      return await cameraApi.getLayouts();
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createLayout = createAsyncThunk(
  "layouts/createLayout",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await cameraApi.createLayout(payload);
      dispatch(fetchLayouts());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteLayout = createAsyncThunk(
  "layouts/deleteLayout",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await cameraApi.deleteLayout(id);
      dispatch(fetchLayouts());
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const layoutsSlice = createSlice({
  name: "layouts",
  initialState: {
    presets: {},
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLayouts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLayouts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.presets = action.payload || {};
      })
      .addCase(fetchLayouts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default layoutsSlice.reducer;
