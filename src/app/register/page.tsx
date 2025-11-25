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
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!displayName || !email || !password) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    // 1️⃣ Crear usuario en auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2️⃣ Insertar en profiles usando el ID que creó auth
    if (!authData.user) {
      setError("No se pudo crear el usuario.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        email,
        display_name: displayName,
        role: "estudiante",
      },
    ]);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setSuccess("Cuenta creada correctamente. Revisa tu email para confirmar.");
    setDisplayName("");
    setEmail("");
    setPassword("");
    setLoading(false);
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

        <button onClick={handleRegister} disabled={loading} className="cta-button">
          {loading ? "Creando..." : "Crear Cuenta"}
        </button>

        <p>
          ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
