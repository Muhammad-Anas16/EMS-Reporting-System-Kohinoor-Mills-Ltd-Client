import * as yup from "yup";

const authSchema = yup.object({
  username: yup.string().trim().required("Username is required"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
});

export default authSchema;
