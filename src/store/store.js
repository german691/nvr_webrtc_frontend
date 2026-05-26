import { configureStore } from "@reduxjs/toolkit";
import cameraReducer from "./slices/cameraSlice";
import layoutsReducer from "./slices/layoutsSlice";

export const store = configureStore({
  reducer: {
    cameras: cameraReducer,
    layouts: layoutsReducer,
  },
});
