"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setError(error.message);
    else {
      console.log("Login exitoso", data);
      // Redirige a otra página si quieres:
      // router.push("/dashboard");
    }
  };

  return (
    <div>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="button" onClick={handleLogin}>Login</button>
      {error && <p>{error}</p>}
    </div>
  );
}
