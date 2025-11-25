"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else {
      router.push("/"); // redirige al dashboard o homepage
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#0b2f26] p-4"
      style={{ backgroundImage: "url('/fondo.jpg')", backgroundSize: "cover" }}
    >
      <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl p-8 max-w-md w-full shadow-xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-[#0b2f26]">Iniciar Sesión</h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14543c]"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#14543c]"
        />

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <button
          onClick={handleLogin}
          className="bg-[#0b2f26] hover:bg-[#14543c] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:scale-105"
        >
          Login
        </button>

        <p className="text-center text-gray-700">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-[#0b2f26] font-bold hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
