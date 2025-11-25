"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ClassItem {
  id: string;
  name: string;
}

interface User {
  id: string;
  display_name: string;
}

interface Assignment {
  id: string;
  class_id: string;
  title: string;
  image_url?: string;
  attempts: number;
  problem_description?: string;
  correct_answer?: string;
}

interface StudentResponse {
  id: string;
  student_id: string;
  response: string;
  is_correct: boolean;
  created_at: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);

  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    class_id: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
    image_url: "",
  });

  const [message, setMessage] = useState("");

  // ===== Fetch Data =====
  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchAssignments(selectedClass);
  }, [selectedClass]);

  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) return console.log(error);
    setClasses(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return console.log(error);
    setUsers(data || []);
  };

  const fetchAssignments = async (classId: string) => {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId);
    if (error) return console.log(error);
    setAssignments(data || []);
  };

  const fetchResponses = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .eq("assignment_id", assignmentId);
    if (error) return console.log(error);
    setResponses(data || []);
  };

  // ===== Actions =====
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

  const handleAddParticipant = async () => {
    if (!selectedClass || !selectedUser) return setMessage("Selecciona clase y usuario");
    const { error } = await supabase.from("class_participants").insert([
      { class_id: selectedClass, user_id: selectedUser },
    ]);
    if (error) return setMessage(error.message);
    setMessage("Participante añadido");
    setSelectedUser("");
  };

  const handleUploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("assignments")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      return "";
    }

    const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.class_id) return setMessage("Completa los campos");
    const { error } = await supabase.from("assignments").insert([newAssignment]);
    if (error) return setMessage(error.message);
    setMessage("Asignación creada");
    setNewAssignment({
      title: "",
      class_id: selectedClass,
      attempts: 1,
      problem_description: "",
      correct_answer: "",
      image_url: "",
    });
    fetchAssignments(selectedClass);
  };

  const handleDeleteAssignment = async (id: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) return setMessage(error.message);
    fetchAssignments(selectedClass);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setNewAssignment({
      ...assignment,
      class_id: assignment.class_id,
    });
  };

  // ===== Styles =====
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    color: "#000",
    padding: "16px",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const inputStyle: React.CSSProperties = {
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };
  const thStyle: React.CSSProperties = {
    borderBottom: "2px solid #ccc",
    padding: 8,
    textAlign: "left",
  };
  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #eee",
    padding: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b2f26", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ color: "#fff" }}>Panel Docente</h1>
      {message && <div style={{ color: "#ffd700", background: "#222", padding: 8, borderRadius: 6 }}>{message}</div>}

      {/* Crear Clase */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button className="cta-button" onClick={handleCreateClass}>Crear Clase</button>
        </div>
      </div>

      {/* Añadir Participante */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...inputStyle, flex: 1 }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Selecciona Clase</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={{ ...inputStyle, flex: 1 }} value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">Selecciona Usuario</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </select>
          <button className="cta-button" onClick={handleAddParticipant}>Añadir</button>
        </div>
      </div>

      {/* Crear / Editar Asignación */}
      <div style={cardStyle}>
        <h2>{newAssignment.id ? "Editar Asignación" : "Crear Asignación"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <select style={inputStyle} value={newAssignment.class_id} onChange={(e) => setNewAssignment({...newAssignment, class_id: e.target.value})}>
            <option value="">Selecciona Clase</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={inputStyle} placeholder="Título" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} />
          <input style={inputStyle} type="number" min={1} placeholder="Número de intentos" value={newAssignment.attempts} onChange={(e) => setNewAssignment({...newAssignment, attempts: Number(e.target.value)})} />
          <textarea style={inputStyle} placeholder="Situación problema" value={newAssignment.problem_description} onChange={(e) => setNewAssignment({...newAssignment, problem_description: e.target.value})} />
          <textarea style={inputStyle} placeholder="Respuesta correcta (código G)" value={newAssignment.correct_answer} onChange={(e) => setNewAssignment({...newAssignment, correct_answer: e.target.value})} />
          <input type="file" onChange={async (e) => {
            if (!e.target.files) return;
            const url = await handleUploadImage(e.target.files[0]);
            setNewAssignment({...newAssignment, image_url: url});
          }} />
          <button className="cta-button" onClick={handleCreateAssignment}>
            {newAssignment.id ? "Guardar cambios" : "Crear Asignación"}
          </button>
        </div>
      </div>

      {/* Tabla de Asignaciones */}
      <div style={cardStyle}>
        <h2>Asignaciones</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Clase</th>
              <th style={thStyle}>Intentos</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>{classes.find(c => c.id === a.class_id)?.name || ""}</td>
                <td style={tdStyle}>{a.attempts}</td>
                <td style={tdStyle}>
                  <button className="cta-button" onClick={() => handleEditAssignment(a)}>Editar</button>
                  <button className="cta-button" onClick={() => handleDeleteAssignment(a.id)}>Eliminar</button>
                  <button className="cta-button" onClick={() => fetchResponses(a.id)}>Revisar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Respuestas */}
      {responses.length > 0 && (
        <div style={cardStyle}>
          <h2>Respuestas de Estudiantes</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID Estudiante</th>
                <th style={thStyle}>Respuesta</th>
                <th style={thStyle}>Correcta</th>
                <th style={thStyle}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(r => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.student_id}</td>
                  <td style={tdStyle}>{r.response}</td>
                  <td style={tdStyle}>{r.is_correct ? "Sí" : "No"}</td>
                  <td style={tdStyle}>{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
