import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

// Async thunks
export const fetchMedicalRecords = createAsyncThunk(
  'medicalRecords/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/medical-records?${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMedicalRecordById = createAsyncThunk(
  'medicalRecords/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/medical-records/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPatientMedicalRecords = createAsyncThunk(
  'medicalRecords/fetchByPatient',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/patients/${patientId}/medical-records`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createMedicalRecord = createAsyncThunk(
  'medicalRecords/create',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.post('/medical-records', recordData);
      toast.success('Medical record created successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create medical record';
      toast.error(message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateMedicalRecord = createAsyncThunk(
  'medicalRecords/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/medical-records/${id}`, data);
      toast.success('Medical record updated successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update medical record';
      toast.error(message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteMedicalRecord = createAsyncThunk(
  'medicalRecords/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/medical-records/${id}`);
      toast.success('Medical record deleted successfully');
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete medical record';
      toast.error(message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMedicalRecordStats = createAsyncThunk(
  'medicalRecords/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/medical-records/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  records: [],
  currentRecord: null,
  patientRecords: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

const medicalRecordsSlice = createSlice({
  name: 'medicalRecords',
  initialState,
  reducers: {
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all records
      .addCase(fetchMedicalRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMedicalRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMedicalRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchMedicalRecordById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMedicalRecordById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecord = action.payload;
      })
      .addCase(fetchMedicalRecordById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch by patient
      .addCase(fetchPatientMedicalRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatientMedicalRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patientRecords = action.payload;
      })
      .addCase(fetchPatientMedicalRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create record
      .addCase(createMedicalRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMedicalRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records.unshift(action.payload);
      })
      .addCase(createMedicalRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update record
      .addCase(updateMedicalRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMedicalRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.records.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
        if (state.currentRecord?._id === action.payload._id) {
          state.currentRecord = action.payload;
        }
      })
      .addCase(updateMedicalRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete record
      .addCase(deleteMedicalRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMedicalRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = state.records.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteMedicalRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch stats
      .addCase(fetchMedicalRecordStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentRecord, clearError } = medicalRecordsSlice.actions;
export default medicalRecordsSlice.reducer;
