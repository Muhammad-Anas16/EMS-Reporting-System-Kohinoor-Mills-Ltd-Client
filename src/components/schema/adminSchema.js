import * as yup from "yup";

export const adminUserSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),

  type: yup
    .string()
    .oneOf(["admin", "user"], "Select a valid user type")
    .required("User type is required"),
});

export const adminSettingsSchema = yup.object({
  ipAddress: yup.string().trim().required("IP address is required"),

  ipPassword: yup.string().default(""),

  deviceId: yup.string().trim().required("Device ID is required"),

  targetPort: yup
    .number()
    .typeError("Port must be a number")
    .integer("Port must be an integer")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535")
    .required("Target port is required"),

  corsOrigin: yup
    .string()
    .trim()
    .required("CORS origin is required")
    .test("valid-origin", "Enter a valid URL or origin", (value) => {
      if (!value) return false;

      try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    }),
});
