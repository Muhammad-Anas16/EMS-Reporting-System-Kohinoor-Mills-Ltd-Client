import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  UserPlus,
  Users,
  Settings2,
  ArrowLeft,
  Wifi,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  CreateUser,
  GetAllUser,
  getProjectConfiguration,
  createProjectConfiguration,
  updateProjectConfiguration,
} from "@/api/api";
import {
  adminSettingsSchema,
  adminUserSchema,
} from "@/components/schema/adminSchema";

const initialUser = {
  username: "",
  password: "",
  type: "user",
};

const initialSettings = {
  ipAddress: "",
  ipPassword: "",
  deviceId: "",
  targetPort: 47808,
  corsOrigin: "",
};

const getPayload = (result) => {
  if (result?.success === false) {
    throw new Error(result.message || "Request failed.");
  }

  return result?.data ?? result;
};

const getErrorText = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const Field = ({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
  required = false,
  min,
  max,
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-slate-300">
      {label}
      {required && <span className="ml-1 text-cyan-400">*</span>}
    </label>

    <input
      id={name}
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      autoComplete="off"
      className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/[0.08] ${
        error
          ? "border-red-400/50"
          : "border-white/[0.09] hover:border-white/[0.16]"
      }`}
    />

    {error && <p className="text-xs text-red-300">{error}</p>}
  </div>
);

const AdminPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [userForm, setUserForm] = useState(initialUser);

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [userErrors, setUserErrors] = useState({});
  const [settingsErrors, setSettingsErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const result = await GetAllUser();
      const payload = getPayload(result);

      const list = Array.isArray(payload)
        ? payload
        : (payload?.users ?? payload?.items ?? []);

      if (!Array.isArray(list)) {
        throw new Error("The server returned an invalid users list.");
      }

      setUsers(list);
    } catch (error) {
      showNotice("error", getErrorText(error));
    } finally {
      setLoadingUsers(false);
    }
  }, [showNotice]);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);

    try {
      const result = await getProjectConfiguration();
      const payload = getPayload(result);
      const config = payload?.settings ?? payload?.configuration ?? payload;

      setSettings({
        ipAddress: config?.ipAddress ?? "",
        ipPassword: "",
        deviceId: config?.deviceId ?? "",
        targetPort: config?.targetPort ?? 47808,
        corsOrigin: config?.corsOrigin ?? "",
      });

      setSettingsLoaded(true);
    } catch (error) {
      setSettingsLoaded(false);
      showNotice("error", getErrorText(error));
    } finally {
      setLoadingSettings(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadUsers();
    loadSettings();
  }, [loadUsers, loadSettings]);

  const handleUserChange = (event) => {
    const { name, value } = event.target;

    setUserForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setUserErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSettingsChange = (event) => {
    const { name, value } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSettingsErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setNotice(null);
    setUserErrors({});

    let validated;

    try {
      validated = await adminUserSchema.validate(userForm, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const errors = {};

      error.inner?.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });

      setUserErrors(errors);
      return;
    }

    setCreatingUser(true);

    try {
      const result = await CreateUser(
        validated.username,
        validated.password,
        validated.type,
      );

      getPayload(result);

      setUserForm(initialUser);
      showNotice("success", "User created successfully.");

      await loadUsers();
    } catch (error) {
      showNotice("error", getErrorText(error));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setNotice(null);
    setSettingsErrors({});

    let validated;

    try {
      validated = await adminSettingsSchema.validate(settings, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      const errors = {};

      error.inner?.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });

      setSettingsErrors(errors);
      return;
    }

    setSavingSettings(true);

    try {
      const result = settingsLoaded
        ? await updateProjectConfiguration(validated)
        : await createProjectConfiguration(validated);

      getPayload(result);

      setSettingsLoaded(true);
      setSettings((previous) => ({
        ...previous,
        ...validated,
        ipPassword: "",
      }));

      showNotice("success", "Project configuration saved successfully.");
    } catch (error) {
      showNotice("error", getErrorText(error));
    } finally {
      setSavingSettings(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "User Management", icon: Users },
    { id: "settings", label: "Project Configuration", icon: Server },
  ];

  const cardClass =
    "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-900/90 to-[#07111c] shadow-lg shadow-black/10";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#050a12] px-3 py-5 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-blue-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1500px] space-y-6">
        <header className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                <ShieldCheck className="h-4 w-4" />
                Kohinoor Mills EMS
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Admin Panel
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Manage system users, server connectivity and project
                configuration from one place.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5 text-xs text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Administration
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                  <Database className="h-3.5 w-3.5" />
                  Server-managed settings
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className={buttonClass}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        </header>

        {notice && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              notice.type === "success"
                ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
                : "border-red-400/20 bg-red-400/[0.06] text-red-200"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{notice.message}</span>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-auto text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <nav className={`${cardClass} flex gap-2 overflow-x-auto p-2`}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/25 shadow-sm shadow-cyan-900/20"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Registered Users
                  </span>
                  <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] p-2.5 text-cyan-300">
                    <Users className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold tabular-nums">
                  {loadingUsers ? "…" : users.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Accounts returned by the admin API
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Manage users <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Project Configuration
                  </span>
                  <span className="rounded-xl border border-blue-400/20 bg-blue-400/[0.08] p-2.5 text-blue-300">
                    <Settings2 className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-5 text-xl font-bold">
                  {loadingSettings
                    ? "Loading…"
                    : settingsLoaded
                      ? "Configured"
                      : "Not loaded"}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Current server configuration status
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  View settings <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Administration</span>
                  <span className="rounded-xl border border-violet-400/20 bg-violet-400/[0.08] p-2.5 text-violet-300">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-5 text-xl font-bold">System Controls</p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  User management and project connectivity settings
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400">
                  <Wifi className="h-3.5 w-3.5 text-cyan-300" />
                  BACnet configuration
                </div>
              </article>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Quickly access the main administration tools.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className={`${cardClass} group p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/25`}
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300 transition group-hover:bg-cyan-400/[0.14]">
                    <UserPlus className="h-5 w-5" />
                  </span>

                  <h3 className="mt-4 font-semibold">User Management</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    View registered accounts and create users with the
                    appropriate access type.
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                    Open user management
                    <span aria-hidden="true">→</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`${cardClass} group p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/25`}
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/[0.08] text-blue-300 transition group-hover:bg-blue-400/[0.14]">
                    <Server className="h-5 w-5" />
                  </span>

                  <h3 className="mt-4 font-semibold">Project Configuration</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Configure the server address, BACnet device ID, port and
                    allowed CORS origin.
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                    Open configuration
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "users" && (
          <section className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
            <form
              onSubmit={handleCreateUser}
              className={`${cardClass} space-y-5 p-5 sm:p-6`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-cyan-400/[0.08] p-2 text-cyan-300">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold">Create User</h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Create a new account using the existing admin API.
                </p>
              </div>

              <Field
                label="Username"
                name="username"
                value={userForm.username}
                onChange={handleUserChange}
                placeholder="Enter username"
                required
                error={userErrors.username}
              />

              <div className="space-y-2">
                <label
                  htmlFor="new-user-password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Password <span className="text-cyan-400">*</span>
                </label>

                <div className="relative">
                  <input
                    id="new-user-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={handleUserChange}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    className={`w-full rounded-xl border bg-slate-950/70 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/[0.08] ${
                      userErrors.password
                        ? "border-red-400/50"
                        : "border-white/[0.09]"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {userErrors.password && (
                  <p className="text-xs text-red-300">{userErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="user-type"
                  className="block text-sm font-medium text-slate-300"
                >
                  User Type <span className="text-cyan-400">*</span>
                </label>

                <select
                  id="user-type"
                  name="type"
                  value={userForm.type}
                  onChange={handleUserChange}
                  className="w-full rounded-xl border border-white/[0.09] bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                {userErrors.type && (
                  <p className="text-xs text-red-300">{userErrors.type}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingUser ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {creatingUser ? "Creating user…" : "Create User"}
              </button>
            </form>

            <div className={`${cardClass} min-w-0 overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
                <div>
                  <h2 className="text-lg font-semibold">Registered Users</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {users.length} account(s) returned by the server
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={loadingUsers}
                  className={buttonClass}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[430px] text-left text-sm">
                  <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Username</th>
                      <th className="px-5 py-4 font-medium">User Type</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06]">
                    {loadingUsers && users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-12 text-center text-slate-400"
                        >
                          <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-cyan-300" />
                          Loading users…
                        </td>
                      </tr>
                    ) : users.length > 0 ? (
                      users.map((user, index) => (
                        <tr
                          key={user.id ?? user._id ?? user.username ?? index}
                          className="transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4 font-medium text-slate-200">
                            {user.username ?? user.name ?? "Unnamed user"}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-2.5 py-1 text-xs text-cyan-200">
                              {user.type ?? user.role ?? "user"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {user.active === false ||
                            user.isActive === false ? (
                              <span className="inline-flex items-center gap-2 text-xs text-amber-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                                Inactive
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                Registered
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          <Users className="mx-auto mb-3 h-6 w-6 opacity-50" />
                          No users found, or the API returned an empty list.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] p-2.5 text-cyan-300">
                    <Server className="h-5 w-5" />
                  </span>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Project Configuration
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Manage server and BACnet connection settings.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadSettings}
                disabled={loadingSettings}
                className={buttonClass}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loadingSettings ? "animate-spin" : ""}`}
                />
                Reload Settings
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium text-cyan-100">
                      Server-managed configuration
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Configuration is loaded and saved through the existing
                      server API. Confirm the values before saving because they
                      may affect server connectivity.
                    </p>
                  </div>
                </div>
              </div>

              {loadingSettings ? (
                <div className="flex items-center justify-center gap-3 py-14 text-sm text-slate-400">
                  <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                  Loading server configuration…
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Server IP Address"
                      name="ipAddress"
                      value={settings.ipAddress}
                      onChange={handleSettingsChange}
                      placeholder="192.168.1.100"
                      required
                      error={settingsErrors.ipAddress}
                    />

                    <Field
                      label="BACnet Device ID"
                      name="deviceId"
                      value={settings.deviceId}
                      onChange={handleSettingsChange}
                      placeholder="Enter device ID"
                      required
                      error={settingsErrors.deviceId}
                    />

                    <Field
                      label="BACnet Target Port"
                      name="targetPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={settings.targetPort}
                      onChange={handleSettingsChange}
                      required
                      error={settingsErrors.targetPort}
                    />

                    <Field
                      label="Allowed CORS Origin"
                      name="corsOrigin"
                      value={settings.corsOrigin}
                      onChange={handleSettingsChange}
                      placeholder="http://localhost:5173"
                      required
                      error={settingsErrors.corsOrigin}
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Server / IP Password"
                        name="ipPassword"
                        type="password"
                        value={settings.ipPassword}
                        onChange={handleSettingsChange}
                        placeholder="Leave blank if you do not want to change it"
                        error={settingsErrors.ipPassword}
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Password is never prefilled from the server. Confirm
                        that your backend supports password updates before
                        submitting a new password.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center">
                    <p className="max-w-xl text-xs leading-5 text-slate-500">
                      Check the IP address, device ID and port before saving.
                      Incorrect values may interrupt BACnet communication.
                    </p>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {savingSettings
                        ? "Saving configuration…"
                        : "Save Configuration"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            Kohinoor Mills EMS
          </span>

          <span>Admin Panel · User Management · Project Configuration</span>
        </footer>
      </div>
    </main>
  );
};

export default AdminPage;
