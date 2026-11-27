import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "axios";
import { checkoutOrders } from './orderSlice';
import { logout } from './userSlice';
import { disableProduct } from './productSlice';

const URL = 'http://localhost:8080';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (token) => {
  const { data } = await axios.get(`${URL}/carts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
});

export const addToCart = createAsyncThunk('cart/addToCart', async (cartData) => {
  const { token, productId, quantity } = cartData;
  const { data } = await axios.post(
      `${URL}/cartItems`, { productId, quantity },
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

export const removeOneFromCart = createAsyncThunk('cart/removeOneFromCart', async (cartData) => {
  const { token, productId } = cartData;
  const headers = { Authorization: `Bearer ${token}` };
  await axios.delete(`${URL}/cartItems/product/one/${productId}`, { headers });
  const { data } = await axios.get(`${URL}/carts`, { headers });
  return data;
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (cartData) => {
  const { token, productId } = cartData;
  const headers = { Authorization: `Bearer ${token}` };
  await axios.delete(`${URL}/cartItems/product/${productId}`, { headers });
  const { data } = await axios.get(`${URL}/carts`, { headers });
  return data;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
     .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
     })
     .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
     })
     .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(removeOneFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(removeOneFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
     })
     .addCase(removeOneFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
     })
     .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     // Después de comprar, el carrito queda vacío
     .addCase(checkoutOrders.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
     })
     // Al cerrar sesión, se borra el carrito del usuario anterior
     .addCase(logout, (state) => {
        state.items = [];
        state.total = 0;
     })
     // Si el vendedor pausa un producto que tenía en su carrito, se saca
     .addCase(disableProduct.fulfilled, (state, action) => {
        const item = state.items.find((i) => i.productId === action.payload);
        if (item) {
          state.total = state.total - item.subtotal;
          state.items = state.items.filter((i) => i.productId !== action.payload);
        }
     })
  }

});

export default cartSlice.reducer;
