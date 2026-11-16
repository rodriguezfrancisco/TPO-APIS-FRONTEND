import {createSlice} from '@reduxjs/toolkit';
import axios from "axios";

const URL = 'http://localhost:8080';

export const fetchCategories = createAsyncThunk('category/fetchCategories', async () => {
  const {}
});

const categorySlice = createSlice({
  name: 'category',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
     .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
     })
     .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(createCategory.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload];
     })
  }

});

export default categorySlice.reducer;
