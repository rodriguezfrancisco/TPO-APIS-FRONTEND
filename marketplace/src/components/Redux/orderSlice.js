import {createSlice} from '@reduxjs/toolkit';

const URL = 'http://localhost:8080';

export const createAsyncThunk fetchOrders('order/fetchOrders', async () => {
  const { data } = await axios.post(URL);
  return data;
});

export const createAsyncThunk checkoutOrders('order/checkoutOrders', async () => {
  const { paymentMethod, deliveryMethod  } = await axios.post(URL);
  return data;
});

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    items: [],
    loading: true,
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
     .addCase(checkout.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload];
     })
  }
  
});

export default orderSlice.reducer;
  
