import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "axios";

const URL = 'http://localhost:8080/categories';

export const fetchCategories = createAsyncThunk('category/fetchCategories', async () => {
  const { data } = await axios.get(URL);
  return data.content;
});

export const createCategory = createAsyncThunk('category/createCategory', async (categoryData) => {
  const { token, description } = categoryData;
  const { data } = await axios.post(
      URL, { description },
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

const categorySlice = createSlice({
  name: 'category',
  initialState: {
    items: [],
    loading: false,
    error: null,
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
     .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(createCategory.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload];
        state.loading = false;
     })
     .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
  }

});

export default categorySlice.reducer;
