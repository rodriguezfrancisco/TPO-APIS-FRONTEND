import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "axios";

const URL = 'http://localhost:8080/orders';

export const fetchOrders = createAsyncThunk('order/fetchOrders', async (token) => {
  const { data } = await axios.get(URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
});

export const checkoutOrders = createAsyncThunk('order/checkoutOrders', async (orderData) => {
  const { token, paymentMethod, deliveryMethod  } = orderData;
  const { data } = await axios.post(
      `${URL}/checkout`, { paymentMethod, deliveryMethod },
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
     .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
     })
     .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(checkoutOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(checkoutOrders.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload];
        state.loading = false;
     })
     .addCase(checkoutOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
  }
  
});

export default orderSlice.reducer;
  
