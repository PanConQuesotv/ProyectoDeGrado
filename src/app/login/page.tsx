"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="container">
      <div className="card">
        <h1>Iniciar Sesión</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button>Ingresar</button>
        <p>
          ¿No tienes cuenta? <Link href="/register" className="link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
