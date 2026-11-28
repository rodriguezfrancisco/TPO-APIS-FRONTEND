import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { logout } from './userSlice';
import { checkoutOrders } from './orderSlice';

const BASE_URL = 'http://localhost:8080';
const URL = `${BASE_URL}/products`;

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
    URL,
    product,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

export const uploadProductImage = createAsyncThunk('product/uploadProductImage', async ({ token, productId, file }) => {
  const formData = new FormData();
  formData.append('productId', productId);
  formData.append('name', file.name);
  formData.append('file', file);

  const { data } = await axios.post(`${BASE_URL}/images`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { productId, image: data };
});

export const updateProduct = createAsyncThunk('product/updateProduct', async (productData) => {
  const { token, id, changes } = productData;
  const { data } = await axios.patch(
    `${URL}/${id}`,
    changes,
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
        state.items = action.payload.content || [];
        state.totalPages = action.payload.totalPages || 1;
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
        state.sellerItems = Array.isArray(action.payload) ? action.payload : [];
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
      .addCase(uploadProductImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProductImage.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, image } = action.payload;
        const imageId = image?.id ?? image?.imageId;
        if (!imageId) return;

        const sellerProd = state.sellerItems.find((p) => p.id === productId);
        if (sellerProd) {
          sellerProd.imageIds = [...(sellerProd.imageIds || []), imageId];
        }
        const catalogProd = state.items.find((p) => p.id === productId);
        if (catalogProd) {
          catalogProd.imageIds = [...(catalogProd.imageIds || []), imageId];
        }
      })
      .addCase(uploadProductImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const sellerIndex = state.sellerItems.findIndex((p) => p.id === action.payload.id);
        if (sellerIndex !== -1) state.sellerItems[sellerIndex] = action.payload;

        const catalogIndex = state.items.findIndex((p) => p.id === action.payload.id);
        if (catalogIndex !== -1) state.items[catalogIndex] = action.payload;

        if (state.selected && state.selected.id === action.payload.id) {
          state.selected = action.payload;
        }
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
        const sellerIndex = state.sellerItems.findIndex((p) => p.id === action.payload);
        if (sellerIndex !== -1) state.sellerItems[sellerIndex].state = false;

        state.items = state.items.filter((p) => p.id !== action.payload);

        if (state.selected && state.selected.id === action.payload) {
          state.selected = { ...state.selected, state: false };
        }
      })
      .addCase(disableProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Descuenta stock localmente después de confirmar una compra (sin hacer otro GET)
      .addCase(checkoutOrders.fulfilled, (state, action) => {
        const orderItems = action.payload?.items || [];
        for (const orderItem of orderItems) {
          const pid = orderItem.productId;
          const qty = orderItem.quantity || 0;
          if (!pid || !qty) continue;

          const catalogProd = state.items.find((p) => p.id === pid);
          if (catalogProd) catalogProd.stock = Math.max(0, catalogProd.stock - qty);

          const sellerProd = state.sellerItems.find((p) => p.id === pid);
          if (sellerProd) sellerProd.stock = Math.max(0, sellerProd.stock - qty);

          if (state.selected && state.selected.id === pid) {
            state.selected.stock = Math.max(0, state.selected.stock - qty);
          }
        }
      })
      // Al cerrar sesión se limpian los productos privados del vendedor
      .addCase(logout, (state) => {
        state.sellerItems = [];
      });
  },
});

export const { setPage, setFilters } = productSlice.actions;
export default productSlice.reducer;