import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="container">
      <div className="card">
        <h1>Registrarse</h1>
        <input
          type="text"
          placeholder="Nombre"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
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
        <button>Crear Cuenta</button>
        <p>
          ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}
