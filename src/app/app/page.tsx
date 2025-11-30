"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { Credentials } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/store/store";
import { toast } from "sonner";
import { validateCredentials } from "@/app/actions/auth.actions";
import { getConfig } from "@/app/actions/config.actions";

interface LoginConfig {
  credentialsMode?: string;
  azureAdEnabled?: string;
}

enum LoginStage {
  CREDENTIALS = "credentials",
  TOKEN = "token",
}

export default function Login() {
  const router = useRouter();
  const { errors, setErrors, setLoading, isLoading } = useStore();
  const [credentials, setCredentials] = useState<Credentials>({
    username: "",
    password: "",
  });
  const [token, setToken] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginStage, setLoginStage] = useState<LoginStage>(
    LoginStage.CREDENTIALS
  );
  const [authCode, setAuthCode] = useState<string>("");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [config, setConfig] = useState<LoginConfig>({});
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const result = await getConfig();

        if (!result.success) {
          throw new Error(result.error);
        }

        setConfig(result.data);
        setConfigError(null);
      } catch (error: any) {
        console.error("Config fetch error:", error);
        setConfigError(error.message || "Failed to load configuration");
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (configLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
        <div
          className="h-full min-w-[40%] bg-white rounded-3xl shadow-2xl px-10 py-7 z-[11] flex items-center justify-center"
          style={{ boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.35)" }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
        <div
          className="h-full min-w-[40%] bg-white rounded-3xl shadow-2xl px-10 py-7 z-[11] flex items-center justify-center"
          style={{ boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.35)" }}
        >
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="text-red-600 mb-2">⚠️ Configuration Error</div>
            <p className="text-red-700 text-sm mb-4">{configError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let isValid = true;

    if (!credentials.username.trim()) {
      setErrors("username", true, "User NT is required");
      isValid = false;
    }

    if (!credentials.password) {
      setErrors("password", true, "Password is required");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    try {
      setLoading(true);

      const result = await validateCredentials({
        username: credentials.username,
        password: credentials.password,
      });

      if (result.httpStatusCode === 200 && result.data) {
        setAuthCode(result.data.code);
        setAuthUsername(result.data.username);
        setLoginStage(LoginStage.TOKEN);
        toast.success(result.message);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error: any) {
      toast.error(
        error.message || "An error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token.trim()) {
      setErrors("token", true, "Token is required");
      return;
    }

    if (!config.credentialsMode) {
      toast.error("Configuration not loaded. Please refresh the page.");
      return;
    }

    try {
      setLoading(true);

      const provider =
        config.credentialsMode === "production"
          ? "middleware-credentials"
          : "mock-credentials";

      const result = await signIn(provider, {
        redirect: false,
        username: authUsername,
        code: authCode,
        token: token,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.ok) {
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (!session && attempts < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, 200 * (attempts + 1))
          );
          session = await getSession();
          attempts++;
        }

        if (session) {
          const sessionData = {
            user: {
              name: session.user.name,
              email: session.user.email,
              nt: session.user.nt || credentials.username.toUpperCase(),
              role: session.user.role || [""],
            },
            expires: session.expires,
          };

          try {
            localStorage.setItem("session", JSON.stringify(sessionData));
          } catch (storageError) {
            console.warn(
              "Failed to save session to localStorage:",
              storageError
            );
          }

          toast.success("Login successful! Redirecting...");

          router.push("/dashboard");
        } else {
          toast.error("Session creation failed. Please try again.");
        }
      } else {
        toast.error("Login failed. Please check your token.");
      }
    } catch (error: any) {
      console.error("Token verification Error", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (error.message.includes("Invalid URL")) {
        toast.error("Configuration error - invalid URL");
      } else {
        toast.error(
          "An error occurred during token verification. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStage(LoginStage.CREDENTIALS);
    setToken("");
    setAuthCode("");
    setAuthUsername("");
    setErrors("token", false);
  };

  const handleSignIn = () => {
    signIn("azure-ad", { callbackUrl: "/dashboard" });
  };

  const renderCredentialsForm = () => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          UserNT
        </label>
        <input
          type="text"
          className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors text-xs ${
            errors.username?.hasError ? "border-red-500" : "border-gray-300"
          }`}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={credentials.username}
          onChange={(e) => {
            setCredentials({
              ...credentials,
              username: e.target.value,
            });
            if (e.target.value) {
              setErrors("username", false);
            }
          }}
          placeholder="Enter your NT User ID"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors text-xs pr-12 ${
              errors.password?.hasError ? "border-red-500" : "border-gray-300"
            }`}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            value={credentials.password}
            onChange={(e) => {
              setCredentials({
                ...credentials,
                password: e.target.value,
              });
              if (e.target.value) {
                setErrors("password", false);
              }
            }}
            placeholder="Enter your password"
            autoComplete="off"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className={`w-full font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed  text-base text-white ${
          credentials.username && credentials.password
            ? "hover:bg-blue-800"
            : "cursor-not-allowed"
        }`}
        style={{
          backgroundColor:
            credentials.username && credentials.password
              ? "#1e3a8a"
              : "#99afcd",
        }}
        disabled={isLoading || !credentials.username || !credentials.password}
      >
        {isLoading ? "Validating..." : "Login"}
      </button>

      {config.azureAdEnabled === "enabled" && (
        <button
          type="button"
          className="w-full mt-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-md transition-colors text-sm"
          onClick={handleSignIn}
        >
          Login With SSO
        </button>
      )}
    </form>
  );

  const renderTokenForm = () => (
    <form onSubmit={handleTokenSubmit} className="space-y-6">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-600">
          Logged in as: <span className="font-semibold">{authUsername}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entrust Token
        </label>
        <input
          type="password"
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs ${
            errors.token?.hasError ? "border-red-500" : "border-gray-300"
          }`}
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            if (e.target.value) {
              setErrors("token", false);
            }
          }}
          placeholder="Enter your token"
          maxLength={8}
          minLength={8}
          autoComplete="off"
        />
        {errors.token?.hasError && (
          <p className="text-red-500 text-xs mt-1">{errors.token.message}</p>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors text-sm"
          onClick={handleBackToCredentials}
          disabled={isLoading}
        >
          Back
        </button>
        <button
          type="submit"
          className={`flex-1 font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed text-base text-white ${
            token.trim() ? "hover:bg-blue-800" : "cursor-not-allowed"
          }`}
          style={{
            backgroundColor: token.trim() ? "#1e3a8a" : "#99afcd",
          }}
          disabled={isLoading || !token.trim()}
        >
          {isLoading ? "Verifying..." : "Login"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      <div
        className="h-full min-w-[35%] bg-white rounded-3xl shadow-2xl px-10 py-7 z-11"
        style={{ boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.35)" }}
      >
        <div className="flex justify-center mb-4">
          <Image
            src="/images/Access-bank1.svg"
            alt="Access Bank"
            width={160}
            height={60}
            priority
            className=""
          />
        </div>

        <div className="text-center mb-5">
          <span className="text-md ">Omnichannel Customer Management</span>
        </div>

        {loginStage === LoginStage.CREDENTIALS
          ? renderCredentialsForm()
          : renderTokenForm()}
      </div>
    </div>
  );
}
