"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

interface Class {
  id: string;
  name: string;
  created_by: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const roles = ["Estudiante", "Docente", "Administador"];

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) console.log(error);
    else setUsers(data);
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase.from("classes").select("*");
    if (error) console.log(error);
    else setClasses(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) console.log(error);
    else fetchUsers();
  };

  const createClass = async () => {
    if (!newClassName) return;
    const user = await supabase.auth.getUser();
    const { error } = await supabase.from("classes").insert([
      {
        name: newClassName,
        created_by: user.data.user?.id,
      },
    ]);
    if (error) console.log(error);
    else {
      setNewClassName("");
      fetchClasses();
    }
  };

  const addParticipant = async () => {
    if (!selectedClass || !selectedUser) return;
    const { error } = await supabase.from("class_participants").insert([
      {
        class_id: selectedClass,
        user_id: selectedUser,
      },
    ]);
    if (error) console.log(error);
    else {
      setSelectedClass(null);
      setSelectedUser(null);
      alert("Participante añadido");
    }
  };

  // ===== Estilos =====
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0b2f26",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    color: "#0b2f26",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "900px",
    marginBottom: "20px",
    color: "#000",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
  };

  const thStyle: React.CSSProperties = {
    borderBottom: "2px solid #ccc",
    padding: "8px",
    textAlign: "left",
  };

  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #eee",
    padding: "8px",
  };

  const selectStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "8px",
    background: "#fff",
    color: "#000",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#fff" }}>Panel de Administrador</h1>

      {/* ===== Usuarios ===== */}
      <div style={cardStyle}>
        <h2>Usuarios</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.display_name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={tdStyle}>
                  <select
                    style={selectStyle}
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Crear Clase ===== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <input
          className="cta-button"
          type="text"
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          style={{ marginRight: "8px" }}
        />
        <button className="cta-button" onClick={createClass}>
          Crear Clase
        </button>
      </div>

      {/* ===== Añadir Participante ===== */}
      <div style={cardStyle}>
        <h2>Añadir Participante a Clase</h2>
        <select
          style={selectStyle}
          value={selectedClass || ""}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Selecciona Clase</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Selecciona Usuario</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </select>

        <button className="cta-button" onClick={addParticipant}>
          Añadir
        </button>
      </div>
    </div>
  );
}
