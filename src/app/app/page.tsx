"use client";

import { UserRoles } from "@/lib/types";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { toast } from "sonner";

// Role-based redirect configuration - MUST match UserRoles enum
const ROLE_REDIRECTS: Record<UserRoles, string> = {
  [UserRoles.Admin]: "/a/dashboard",
  [UserRoles.Manager]: "/m/dashboard",
  [UserRoles.Receptionist]: "/dashboard",
  [UserRoles.Guest]: "/home",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("auth-credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Fetch session to get user role
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role) {
        // Handle if role comes as array
        const userRole = Array.isArray(session.user.role)
          ? session.user.role[0]
          : session.user.role;

        console.log("User Role:", userRole);
        console.log("Available redirects:", Object.keys(ROLE_REDIRECTS));

        // Redirect based on user role
        const redirectPath = ROLE_REDIRECTS[userRole as UserRoles];

        if (redirectPath) {
          toast.success(`Welcome back, ${session.user.firstName}!`);
          router.push(redirectPath);
          router.refresh();
        } else {
          console.error(`No redirect path found for role: ${userRole}`);
          toast.error("Invalid user role configuration");
          // Fallback to default dashboard if role not found
          // router.push("/dashboard");
          router.refresh();
        }
      } else {
        console.error("No role found in session");
        // Fallback if no role is found
        // router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      <div
        className="h-full min-w-[35%] bg-white rounded-3xl shadow-2xl px-10 py-7 z-11"
        style={{ boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.35)" }}
      >
        <div className="flex justify-center mb-4">
          <Image
            src="/images/hotelng-gray.png"
            alt="HotelNg"
            width={160}
            height={60}
            priority
            className=""
          />
        </div>

        {/* <div className="text-center mb-5">
          <span className="text-md ">La Hotel</span>
        </div>
        */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors text-xs `}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-2 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors text-xs pr-12`}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="off"
                disabled={isLoading}
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
              email && password ? "hover:bg-blue-800" : "cursor-not-allowed"
            }`}
            style={{
              backgroundColor: email && password ? "#1e3a8a" : "#99afcd",
            }}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? "Validating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
