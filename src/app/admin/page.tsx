"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: classData } = await supabase.from("classes").select("*");
    if (profiles) setUsers(profiles);
    if (classData) setClasses(classData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangeRole = async (userId: string, newRole: string) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) setMessage(error.message);
    else setMessage("Rol actualizado correctamente.");
    setLoading(false);
    fetchData();
  };

  const handleCreateClass = async () => {
    if (!newClassName) return;
    setLoading(true);
    const { error } = await supabase.from("classes").insert([{ name: newClassName }]);
    if (error) setMessage(error.message);
    else setMessage("Clase creada correctamente.");
    setNewClassName("");
    setLoading(false);
    fetchData();
  };

  const handleAddParticipant = async () => {
    if (!selectedClass || !selectedUserId) return;
    setLoading(true);
    const { error } = await supabase.from("class_participants").insert([
      { class_id: selectedClass, user_id: selectedUserId },
    ]);
    if (error) setMessage(error.message);
    else setMessage("Participante añadido correctamente.");
    setLoading(false);
  };

  const inputStyle = {
    padding: "8px 12px",
    margin: "5px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box",
  };

  const selectStyle = {
    padding: "8px 12px",
    margin: "5px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
  };

  const thStyle = {
    borderBottom: "2px solid #ddd",
    padding: "8px",
    textAlign: "left",
  };

  const tdStyle = {
    borderBottom: "1px solid #eee",
    padding: "8px",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "#fff",
          padding: 25,
          borderRadius: 12,
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 20 }}>Panel de Admin</h1>
        {message && <p style={{ color: "green", textAlign: "center" }}>{message}</p>}

        <section>
          <h2>Usuarios</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Cambiar Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{ backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                  <td style={tdStyle}>{u.display_name}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.role}</td>
                  <td style={tdStyle}>
                    <select
                      style={selectStyle}
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      disabled={loading}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Crear Clase</h2>
          <input
            type="text"
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={handleCreateClass}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#0b2f26",
              color: "#fff",
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            Crear Clase
          </button>
        </section>

        <section>
          <h2>Añadir Participante a Clase</h2>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={selectStyle}
          >
            <option value="">Selecciona una clase</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name} ({u.email})
              </option>
            ))}
          </select>

          <button
            onClick={handleAddParticipant}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#0b2f26",
              color: "#fff",
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            Añadir
          </button>
        </section>
      </div>
    </div>
  );
}
