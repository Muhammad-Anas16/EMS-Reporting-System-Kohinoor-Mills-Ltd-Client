import axios from "axios";

const API_BASE_URL = "/api";
const CSRF_STORAGE_KEY = "token";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const getCsrfToken = () => {
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY);
  } catch {
    return null;
  }
};

const setCsrfToken = (token) => {
  if (!token) return;

  api.defaults.headers.common["X-CSRF-Token"] = token;

  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    // Keep the token in Axios memory if storage is unavailable.
  }
};

const clearCsrfToken = () => {
  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }

  delete api.defaults.headers.common["X-CSRF-Token"];
};

const getErrorMessage = (error, fallback = "Request failed.") => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 403) {
    return message || "Request forbidden. Session ya CSRF token check karein.";
  }

  if (status === 401) {
    return message || "Session expire ho gaya hai. Dobara login karein.";
  }

  return message || error?.message || fallback;
};

const getApiError = (error, fallback) => ({
  success: false,
  message: getErrorMessage(error, fallback),
  status: error?.response?.status,
});

const unwrapResponse = (response) => {
  const body = response?.data;

  if (body?.data !== undefined) {
    return body.data;
  }

  return body;
};

// Attach CSRF tokens to write requests only.
api.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    const safeMethods = ["get", "head", "options"];

    if (!safeMethods.includes(method)) {
      const token = getCsrfToken();

      if (token) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-Token"] = token;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Trend Log
export const getTrendLog = async () => {
  try {
    const response = await api.get("/data/trendlog");
    const body = response.data;

    return body?.data?.response ?? body?.data ?? body;
  } catch (error) {
    return getApiError(error, "Trend log fetch failed.");
  }
};

// Energy Log
export const getEnergyLog = async () => {
  try {
    const response = await api.get("/data/energylog");
    const body = response.data;

    return body?.data?.response ?? body?.data ?? body;
  } catch (error) {
    return getApiError(error, "Energy log fetch failed.");
  }
};

// BACnet Read
export const bacnetRead = async (instances) => {
  if (!Array.isArray(instances) || instances.length === 0) {
    return {
      success: false,
      message: "Valid BACnet instances provide karein.",
      data: [],
    };
  }

  const normalizedInstances = [
    ...new Set(
      instances
        .map(Number)
        .filter((instance) => Number.isSafeInteger(instance) && instance >= 0),
    ),
  ];

  if (normalizedInstances.length === 0) {
    return {
      success: false,
      message: "Valid BACnet instances provide karein.",
      data: [],
    };
  }

  try {
    const response = await api.post("/bacnet/read", {
      instances: normalizedInstances,
    });

    return unwrapResponse(response);
  } catch (error) {
    return getApiError(error, "BACnet read failed.");
  }
};

// Login
export const LoginUser = async (username, password) => {
  try {
    const response = await api.post("/auth/login", {
      username,
      password,
    });

    const result = response.data;
    const data = result?.data ?? result;

    if (result?.success && data?.csrfToken) {
      setCsrfToken(data.csrfToken);
    }

    return result;
  } catch (error) {
    return getApiError(error, "Login failed. Please try again.");
  }
};

// Check Current Login Session
export const checkUserIsLogin = async () => {
  try {
    const response = await api.get("/auth/me");

    const result = response.data;
    const data = result?.data ?? result;
    const user = data?.user ?? (data?.username ? data : null);

    if (!user) {
      return {
        success: false,
        isLoggedIn: false,
        user: null,
      };
    }

    if (data?.csrfToken) {
      setCsrfToken(data.csrfToken);
    }

    return {
      success: true,
      isLoggedIn: true,
      user,
    };
  } catch (error) {
    if (error?.response?.status === 401) {
      clearCsrfToken();
    }

    return {
      success: false,
      isLoggedIn: false,
      user: null,
      message: getErrorMessage(error, "Unable to verify login session."),
    };
  }
};

// Logout
export const LogoutUser = async () => {
  try {
    const response = await api.post("/auth/logout");

    clearCsrfToken();

    return response.data;
  } catch (error) {
    return getApiError(error, "Logout failed.");
  }
};

// Create User (Admin)
export const CreateUser = async (username, password, type) => {
  try {
    const response = await api.post("/admin/users", {
      username,
      password,
      type,
    });

    return response.data;
  } catch (error) {
    return getApiError(error, "User create karne mein error aaya.");
  }
};

// Get All Users
export const GetAllUser = async () => {
  try {
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    return getApiError(error, "Users load nahi ho sake.");
  }
};

// Update Admin Settings
export const UpdateAdminSettings = async (settingsData) => {
  try {
    const response = await api.put("/admin/settings", settingsData);
    return response.data;
  } catch (error) {
    return getApiError(error, "Admin settings save karne mein error aaya.");
  }
};

// Project Configuration
export const ProjectConfiguration = async (
  ipAddress,
  ipPassword,
  deviceId,
  targetPort,
  corsOrigin,
) => {
  try {
    const settings = {
      ipAddress,
      ipPassword,
      deviceId,
      targetPort: targetPort || 47808,
      corsOrigin,
    };

    const response = await api.put("/admin/settings", settings);
    return response.data;
  } catch (error) {
    return getApiError(error, "Project configuration update nahi ho saki.");
  }
};

// Get Current Server Configuration
export const getProjectConfiguration = async () => {
  try {
    const response = await api.get("/admin/settings");
    return response.data;
  } catch (error) {
    return getApiError(error, "Server settings load nahi ho sakin.");
  }
};

// Create Initial Server Configuration
export const createProjectConfiguration = async (settings) => {
  try {
    const response = await api.post("/admin/settings", settings);
    return response.data;
  } catch (error) {
    return getApiError(error, "Server configuration create nahi ho saki.");
  }
};

// Update Existing Server Configuration
export const updateProjectConfiguration = async (settings) => {
  try {
    const response = await api.put("/admin/settings", settings);
    return response.data;
  } catch (error) {
    return getApiError(error, "Server settings update nahi ho sakin.");
  }
};

// Delete Server Configuration
export const deleteProjectConfiguration = async () => {
  try {
    const response = await api.delete("/admin/settings");
    return response.data;
  } catch (error) {
    return getApiError(error, "Server configuration delete nahi ho saki.");
  }
};

export default api;
