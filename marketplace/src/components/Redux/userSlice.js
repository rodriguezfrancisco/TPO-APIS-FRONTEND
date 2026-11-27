import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from "axios";

const URL = 'http://localhost:8080';

// Saca el username (sub) que viene adentro del token
const getUsernameFromToken = (token) => {
  try {
    const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(payloadBase64), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload.sub;
  } catch {
    return null;
  }
};

export const loginUser = createAsyncThunk('user/loginUser', async (credentials) => {
  const { data } = await axios.post(`${URL}/api/v1/auth/login`, credentials);
  return data;
});

export const registerUser = createAsyncThunk('user/registerUser', async (newUser) => {
  const { data } = await axios.post(`${URL}/api/v1/auth/register`, newUser);
  return data;
});

export const fetchUsers = createAsyncThunk('user/fetchUsers', async (token) => {
  const { data } = await axios.get(`${URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sub = getUsernameFromToken(token);
  const currentUser = data.content.find((u) => u.username === sub || u.email === sub);
  return { users: data.content, currentUser };
});

export const updateUser = createAsyncThunk('user/updateUser', async (userData) => {
  const { token, id, changes } = userData;
  const { data } = await axios.patch(
      `${URL}/users/${id}`, changes,
      { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    token: '',
    currentUser: null,
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = '';
      state.currentUser = null;
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
     .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
     })
     .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
     })
     .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.users;
        state.currentUser = action.payload.currentUser || null;
     })
     .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
     .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
     })
     .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken } = action.payload;
        const index = state.items.findIndex((u) => u.id === user.id);
        if (index !== -1) state.items[index] = user;
        // Solo si se editó a sí mismo: actualizamos su perfil y su token
        if (state.currentUser && state.currentUser.id === user.id) {
          state.currentUser = user;
          state.token = accessToken;
        }
     })
     .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
     })
  }

});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
