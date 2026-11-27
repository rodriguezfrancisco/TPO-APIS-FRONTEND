import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const URL = 'http://localhost:8080/products';

export const fetchProducts = createAsyncThunk('product/fetchProducts', async (filters) => {
  const { data } = await axios.get(URL, { params: filters });
  return data;
});

export const fetchProductById = createAsyncThunk('product/fetchProductById', async (id) => {
  const { data } = await axios.get(`${URL}/${id}`);
  return data;
});

export const fetchSellerProducts = createAsyncThunk('product/fetchSellerProducts', async (token) => {
  const { data } = await axios.get(`${URL}/seller`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
});

export const createProduct = createAsyncThunk('product/createProduct', async (productData) => {
  const { token, product } = productData;
  const { data } = await axios.post(
      URL, product,
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

export const updateProduct = createAsyncThunk('product/updateProduct', async (productData) => {
  const { token, id, changes } = productData;
  const { data } = await axios.patch(
      `${URL}/${id}`, changes,
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

export const disableProduct = createAsyncThunk('product/disableProduct', async (productData) => {
  const { token, id } = productData;
  await axios.put(`${URL}/${id}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return id;
});

const productSlice = createSlice({
  name: 'product',
  initialState: {
    items: [],
    totalPages: 1,
    page: 0,
    filters: { keyword: '', categoryId: '', minPrice: '', maxPrice: '' },
    selected: null,
    sellerItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    // Toda búsqueda nueva arranca desde la primera página
    setFilters: (state, action) => {
      state.filters = action.payload;
      state.page = 0;
    },
  },
  extraReducers: (builder) => {
    builder
     .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.totalPages = action.payload.totalPages;
     })
     .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
     })
     .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerItems = action.payload;
     })
     .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerItems = [...state.sellerItems, action.payload];
     })
     .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sellerItems.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.sellerItems[index] = action.payload;
     })
     .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(disableProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(disableProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sellerItems.findIndex((p) => p.id === action.payload);
        if (index !== -1) state.sellerItems[index].state = false;
     })
     .addCase(disableProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
  }

});

export const { setPage, setFilters } = productSlice.actions;
export default productSlice.reducer;
