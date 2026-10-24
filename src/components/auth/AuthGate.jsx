import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AuthDialog from "@/components/auth/AuthDialog";
import { checkAuth, selectAuth } from "@/redux/features/auth/authSlice";

export default function AuthGate({ children }) {
  const dispatch = useDispatch();
  const { status, isAuthenticated } = useSelector(selectAuth);

  useEffect(() => {
    if (status === "idle") {
      dispatch(checkAuth());
    }
  }, [dispatch, status]);

  return (
    <>
      {children}

      {!isAuthenticated && <AuthDialog />}
    </>
  );
}
