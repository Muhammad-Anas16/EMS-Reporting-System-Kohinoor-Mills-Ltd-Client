import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LoginUser, LogoutUser, checkUserIsLogin } from "@/api/api";

const initialState = {
  user: null,
  isAuthenticated: false,
  status: "idle", // idle | checking | loading | authenticated | unauthenticated
  error: null,
};

// Verify the existing cookie-based session.
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    const result = await checkUserIsLogin();

    if (!result?.success || !result?.isLoggedIn || !result?.user) {
      return rejectWithValue(result?.message || "Please log in to continue.");
    }

    return result.user;
  },
  {
    condition: (_, { getState }) => {
      return getState().auth.status === "idle";
    },
  },
);

// Login using the existing Axios service.
export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    const result = await LoginUser(username, password);

    if (!result || result.success === false) {
      return rejectWithValue(
        result?.message || "Invalid username or password.",
      );
    }

    const data = result?.data ?? result;
    const user = data?.user ?? (data?.username ? data : null) ?? { username };

    return user;
  },
);

// Clear local Redux authentication even if the logout request fails.
export const logout = createAsyncThunk("auth/logout", async () => {
  await LogoutUser();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Session verification
      .addCase(checkAuth.pending, (state) => {
        state.status = "checking";
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";

        state.error = action.payload ?? null;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = action.payload || "Login failed. Please try again.";
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
