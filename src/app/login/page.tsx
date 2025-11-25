"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    // 1️⃣ Login con Supabase
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !user) {
      setError(loginError?.message || "Error al iniciar sesión");
      return;
    }

    // 2️⃣ Obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    // 3️⃣ Redirigir según rol
    if (profile.role === "Administrador") router.push("/admin");
    else if (profile.role === "Docente") router.push("/teacher");
    else router.push("/student");
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Iniciar Sesión</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Iniciar Sesión</button>
      </div>
    </div>
  );
}
