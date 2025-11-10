import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api.js'

const saved = JSON.parse(localStorage.getItem('hms_auth') || 'null')

export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/login', payload)
    return data.data
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/register', payload)
    return data.data
  } catch (e) {
    return thunkAPI.rejectWithValue(e.response?.data?.message || 'Registration failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: saved?.user || null, accessToken: saved?.accessToken || null, refreshToken: saved?.refreshToken || null, status: 'idle', error: null },
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('hms_auth')
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('hms_auth', JSON.stringify(action.payload))
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(register.fulfilled, (state, action) => {
        // Do NOT auto-login after registration - user must verify email first
        state.status = 'succeeded'
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        // Note: Tokens returned from backend but not stored until email verified
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer
