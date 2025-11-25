"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Class {
  id: string;
  name: string;
  created_by: string;
}

interface User {
  id: string;
  display_name: string;
}

interface Assignment {
  id: string;
  class_id: string;
  title: string;
  image_url: string;
  attempts: number;
  problem_description: string;
  correct_answer: string;
}

interface StudentResponse {
  id: string;
  student_id: string;
  response: string;
  is_correct: boolean;
  created_at: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [newClassName, setNewClassName] = useState("");

  const [newAssignment, setNewAssignment] = useState<Assignment>({
    id: "",
    class_id: "",
    title: "",
    image_url: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
  });

  const [showResponses, setShowResponses] = useState<string | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);

  // ===== Fetch data =====
  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) console.log(error);
    else setClasses(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) console.log(error);
    else setUsers(data);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase.from("assignments").select("*");
    if (error) console.log(error);
    else setAssignments(data);
  };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
    fetchAssignments();
  }, []);

  // ===== Actions =====
  const createClass = async () => {
    if (!newClassName) return;
    const user = await supabase.auth.getUser();
    const { error } = await supabase.from("classes").insert([
      { name: newClassName, created_by: user.data.user?.id },
    ]);
    if (error) console.log(error);
    else {
      setNewClassName("");
      alert("Clase creada correctamente");
      fetchClasses();
    }
  };

  const addParticipant = async () => {
    if (!newAssignment.class_id || !selectedUser) return;
    const { error } = await supabase.from("class_participants").insert([
      { class_id: newAssignment.class_id, user_id: selectedUser },
    ]);
    if (error) console.log(error);
    else {
      setSelectedUser(null);
      alert("Participante añadido");
    }
  };

  const handleAssignmentInput = (field: keyof Assignment, value: any) => {
    setNewAssignment((prev) => ({ ...prev, [field]: value }));
  };

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("assignments")
      .upload(fileName, file);
    if (error) {
      console.log(error);
      return "";
    }
    const { data: publicData } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);
    return publicData.publicUrl;
  };

  const saveAssignment = async () => {
    if (!newAssignment.title || !newAssignment.class_id) {
      alert("Selecciona clase y título");
      return;
    }

    if (newAssignment.id) {
      // EDIT
      const { error } = await supabase
        .from("assignments")
        .update(newAssignment)
        .eq("id", newAssignment.id);
      if (error) console.log(error);
      else {
        alert("Asignación editada correctamente");
        setNewAssignment({
          id: "",
          class_id: "",
          title: "",
          image_url: "",
          attempts: 1,
          problem_description: "",
          correct_answer: "",
        });
        fetchAssignments();
      }
    } else {
      // CREATE
      const { error } = await supabase.from("assignments").insert([newAssignment]);
      if (error) console.log(error);
      else {
        alert("Asignación creada correctamente");
        setNewAssignment({
          id: "",
          class_id: "",
          title: "",
          image_url: "",
          attempts: 1,
          problem_description: "",
          correct_answer: "",
        });
        fetchAssignments();
      }
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setNewAssignment(assignment);
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) console.log(error);
    else fetchAssignments();
  };

  const reviewAssignment = async (id: string) => {
    setShowResponses(id);
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .eq("assignment_id", id);
    if (error) console.log(error);
    else setResponses(data);
  };

  // ===== Styles =====
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0b2f26",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    color: "#fff",
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

  const inputStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    flex: 3,
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    flex: 2,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#0b2f26",
    color: "#fff",
    cursor: "pointer",
    flex: 1,
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
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

  return (
    <div style={containerStyle}>
      <h1>Panel Docente</h1>

      {/* ===== Crear Clase ===== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            style={{ flex: 3, ...inputStyle }}
            type="text"
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button style={buttonStyle} onClick={createClass}>
            Crear Clase
          </button>
        </div>
      </div>

      {/* ===== Añadir Participante ===== */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <select
            style={selectStyle}
            value={newAssignment.class_id || ""}
            onChange={(e) =>
              handleAssignmentInput("class_id", e.target.value)
            }
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
          <button style={buttonStyle} onClick={addParticipant}>
            Añadir
          </button>
        </div>
      </div>

      {/* ===== Crear / Editar Asignación ===== */}
      <div style={cardStyle}>
        <h2>{newAssignment.id ? "Editar Asignación" : "Crear Asignación"}</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            style={selectStyle}
            value={newAssignment.class_id || ""}
            onChange={(e) =>
              handleAssignmentInput("class_id", e.target.value)
            }
          >
            <option value="">Selecciona Clase</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Título de la asignación"
            value={newAssignment.title}
            onChange={(e) =>
              handleAssignmentInput("title", e.target.value)
            }
            style={inputStyle}
          />
          <button style={buttonStyle} onClick={saveAssignment}>
            {newAssignment.id ? "Guardar Cambios" : "Crear"}
          </button>
        </div>

        <input
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts}
          onChange={(e) =>
            handleAssignmentInput("attempts", Number(e.target.value))
          }
          style={{ marginTop: "10px", ...inputStyle }}
        />

        <textarea
          placeholder="Situación problema"
          value={newAssignment.problem_description}
          onChange={(e) =>
            handleAssignmentInput("problem_description", e.target.value)
          }
          style={{ marginTop: "10px", width: "100%", minHeight: "80px" }}
        />

        <input
          type="text"
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) =>
            handleAssignmentInput("correct_answer", e.target.value)
          }
          style={{ marginTop: "10px", ...inputStyle }}
        />

        <input
          type="file"
          onChange={async (e) => {
            if (!e.target.files) return;
            const url = await uploadImage(e.target.files[0]);
            handleAssignmentInput("image_url", url);
          }}
          style={{ marginTop: "10px" }}
        />

        {newAssignment.image_url && (
          <img
            src={newAssignment.image_url}
            alt="RA"
            style={{ width: "100px", marginTop: "10px" }}
          />
        )}
      </div>

      {/* ===== Tabla de Asignaciones ===== */}
      <div style={cardStyle}>
        <h2>Asignaciones</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Clase</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>
                  {classes.find((c) => c.id === a.class_id)?.name || ""}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      style={buttonStyle}
                      onClick={() => handleEditAssignment(a)}
                    >
                      Editar
                    </button>
                    <button
                      style={buttonStyle}
                      onClick={() => deleteAssignment(a.id)}
                    >
                      Eliminar
                    </button>
                    <button
                      style={buttonStyle}
                      onClick={() => reviewAssignment(a.id)}
                    >
                      Revisar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== Respuestas Estudiantes ===== */}
        {showResponses && (
          <div style={{ marginTop: "10px" }}>
            <h3>Respuestas de estudiantes</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Estudiante</th>
                  <th style={thStyle}>Respuesta</th>
                  <th style={thStyle}>Correcta</th>
                  <th style={thStyle}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
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
    </div>
  );
}
