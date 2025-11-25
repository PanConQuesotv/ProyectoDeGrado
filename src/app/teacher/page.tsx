"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ClassItem {
  id: string;
  name: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) return console.log(error);
    setClasses(data || []);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return setMessage("Escribe un nombre de clase");
    const user = await supabase.auth.getUser();
    const { error } = await supabase
      .from("classes")
      .insert([{ name: newClassName, created_by: user.data.user?.id }]);
    if (error) return setMessage(error.message);
    setMessage("Clase creada");
    setNewClassName("");
    fetchClasses();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b2f26",
        color: "#fff",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <h1 style={{ marginBottom: "12px" }}>Panel Docente</h1>
      {message && (
        <div
          style={{
            color: "#ffd700",
            background: "#222",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          {message}
        </div>
      )}

      {/* Crear clase */}
      <div
        style={{
          background: "#fff",
          color: "#000",
          padding: "16px",
          borderRadius: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />
        <button className="cta-button" onClick={handleCreateClass}>
          Crear Clase
        </button>
      </div>

      {/* Seleccionar clase */}
      <div
        style={{
          background: "#fff",
          color: "#000",
          padding: "16px",
          borderRadius: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <select
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Selecciona una clase --</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
