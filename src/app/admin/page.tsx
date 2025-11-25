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

  // 1️⃣ Traer usuarios y clases al cargar la página
  const fetchData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: classData } = await supabase.from("classes").select("*");
    if (profiles) setUsers(profiles);
    if (classData) setClasses(classData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2️⃣ Cambiar rol de un usuario
  const handleChangeRole = async (userId: string, newRole: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) setMessage(error.message);
    else setMessage("Rol actualizado correctamente.");
    setLoading(false);
    fetchData();
  };

  // 3️⃣ Crear clase
  const handleCreateClass = async () => {
    if (!newClassName) return;
    setLoading(true);
    const { error } = await supabase.from("classes").insert([
      {
        name: newClassName,
      },
    ]);
    if (error) setMessage(error.message);
    else setMessage("Clase creada correctamente.");
    setNewClassName("");
    setLoading(false);
    fetchData();
  };

  // 4️⃣ Añadir participante a clase
  const handleAddParticipant = async () => {
    if (!selectedClass || !selectedUserId) return;
    setLoading(true);
    const { error } = await supabase.from("class_participants").insert([
      {
        class_id: selectedClass,
        user_id: selectedUserId,
      },
    ]);
    if (error) setMessage(error.message);
    else setMessage("Participante añadido correctamente.");
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Panel de Admin</h1>
        {message && <p style={{ color: "green" }}>{message}</p>}

        <section>
          <h2>Usuarios</h2>
          <table style={{ width: "100%", marginBottom: 20 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Cambiar Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <select
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
          />
          <button onClick={handleCreateClass} disabled={loading}>
            Crear Clase
          </button>
        </section>

        <section>
          <h2>Añadir Participante a Clase</h2>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(e.target.value)}
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
          >
            <option value="">Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name} ({u.email})
              </option>
            ))}
          </select>

          <button onClick={handleAddParticipant} disabled={loading}>
            Añadir
          </button>
        </section>
      </div>
    </div>
  );
}
