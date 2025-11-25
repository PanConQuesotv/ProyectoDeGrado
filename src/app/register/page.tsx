"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    // 1️⃣ Crear usuario en auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2️⃣ Insertar datos en tabla profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: data.user?.id,
          email,
          display_name: displayName,
          role: "estudiante", // por defecto
        },
      ]);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setSuccess("Cuenta creada correctamente. Revisa tu email para confirmar.");
    setDisplayName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Registrarse</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <input
          type="text"
          placeholder="Nombre"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
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
        <button onClick={handleRegister}>Crear Cuenta</button>
        <p>
          ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
