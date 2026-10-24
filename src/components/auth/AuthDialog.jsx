import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

import authSchema from "@/components/schema/authSchema";
import { login, selectAuth } from "@/redux/features/auth/authSlice";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AuthDialog() {
  const dispatch = useDispatch();
  const { status, error } = useSelector(selectAuth);

  const isLoading = status === "loading";
  const isChecking = status === "checking";

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(authSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    clearErrors();

    try {
      await dispatch(login(values)).unwrap();
    } catch (message) {
      setError("root.server", {
        type: "server",
        message:
          typeof message === "string"
            ? message
            : "Login failed. Please try again.",
      });
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        // Intentionally prevent dismissal until authentication succeeds.
      }}
    >
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md border-white/10 bg-[#080808]/95 text-white shadow-2xl shadow-black/50 backdrop-blur-2xl sm:rounded-2xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="space-y-3 text-left">
          <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <ShieldCheck className="size-6" />
          </div>

          <DialogTitle className="text-2xl font-semibold tracking-tight">
            EMS Sign In
          </DialogTitle>

          <DialogDescription className="text-sm leading-6 text-zinc-400">
            Sign in to access the Kohinoor Mills Energy Management System.
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="flex items-center gap-3 py-8 text-sm text-zinc-300">
            <LoaderCircle className="size-5 animate-spin text-emerald-400" />
            Verifying your session...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-200">
                Username
              </Label>

              <Input
                id="username"
                autoComplete="username"
                placeholder="Enter your username"
                disabled={isLoading}
                aria-invalid={Boolean(errors.username)}
                className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-zinc-600 focus-visible:ring-emerald-400/50"
                {...register("username")}
              />

              {errors.username && (
                <p className="text-sm text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200">
                Password
              </Label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.password)}
                  className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-400/50"
                  {...register("password")}
                />
              </div>

              {errors.password && (
                <p className="text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {(errors.root?.server || error) && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {errors.root?.server?.message || error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-emerald-500 font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-xs text-zinc-500">
              Authorized personnel only
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
