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
  const [selectedClass, setSelectedClass] = useState<string>("");
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [showResponsesFor, setShowResponsesFor] = useState<string | null>(null);

  // ===== Fetch data =====
  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) console.log(error);
    else setClasses(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) console.log(error);
    else setUsers(data || []);
  };

  const fetchAssignments = async () => {
    if (!selectedClass) return setAssignments([]);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", selectedClass);
    if (error) console.log(error);
    else setAssignments(data || []);
  };

  const fetchResponses = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .eq("assignment_id", assignmentId);
    if (error) console.log(error);
    else setResponses(data || []);
  };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass]);

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
      fetchClasses();
      alert("Clase creada correctamente");
    }
  };

  const addParticipant = async (classId: string, userId: string) => {
    const { error } = await supabase.from("class_participants").insert([
      { class_id: classId, user_id: userId },
    ]);
    if (error) console.log(error);
    else alert("Participante añadido correctamente");
  };

  const saveAssignment = async () => {
    if (!newAssignment.title || !newAssignment.class_id) {
      alert("Selecciona clase y escribe el título");
      return;
    }

    try {
      if (newAssignment.id) {
        // Editar
        const { error } = await supabase
          .from("assignments")
          .update({
            title: newAssignment.title,
            class_id: newAssignment.class_id,
            image_url: newAssignment.image_url,
            attempts: newAssignment.attempts,
            problem_description: newAssignment.problem_description,
            correct_answer: newAssignment.correct_answer,
          })
          .eq("id", newAssignment.id);

        if (error) throw error;
        alert("Asignación editada correctamente");
      } else {
        // Crear
        const { error } = await supabase.from("assignments").insert([
          {
            title: newAssignment.title,
            class_id: newAssignment.class_id,
            image_url: newAssignment.image_url,
            attempts: newAssignment.attempts,
            problem_description: newAssignment.problem_description,
            correct_answer: newAssignment.correct_answer,
          },
        ]);
        if (error) throw error;
        alert("Asignación creada correctamente");
      }

      // Reset del formulario
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
    } catch (error) {
      console.log(error);
      alert("Ocurrió un error al guardar la asignación");
    }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) console.log(error);
    else fetchAssignments();
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setNewAssignment({ ...assignment });
  };

  const handleReviewAssignment = (assignmentId: string) => {
    fetchResponses(assignmentId);
    setShowResponsesFor(
      showResponsesFor === assignmentId ? null : assignmentId
    );
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
    width: "70%",
    marginRight: "10px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#0b2f26",
    color: "#fff",
    cursor: "pointer",
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "10px",
  };

  const tdStyle: React.CSSProperties = { padding: "8px", borderBottom: "1px solid #ccc" };
  const thStyle: React.CSSProperties = { padding: "8px", borderBottom: "2px solid #000" };

  return (
    <div style={containerStyle}>
      <h1>Panel Docente</h1>

      {/* ===== Crear Clase ===== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <input
          style={inputStyle}
          type="text"
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />
        <button style={buttonStyle} onClick={createClass}>
          Crear Clase
        </button>
      </div>

      {/* ===== Añadir Participante ===== */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
        <select
          style={selectStyle}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Selecciona Clase</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select style={selectStyle} onChange={(e) => addParticipant(selectedClass, e.target.value)}>
          <option value="">Selecciona Usuario</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Crear Asignación ===== */}
      <div style={cardStyle}>
        <h2>Crear Asignación</h2>
        <select
          style={{ ...selectStyle, width: "80%" }}
          value={newAssignment.class_id}
          onChange={(e) => setNewAssignment({ ...newAssignment, class_id: e.target.value })}
        >
          <option value="">Selecciona Clase</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          style={inputStyle}
          type="text"
          placeholder="Título de la asignación"
          value={newAssignment.title}
          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
        />
        <input
          style={inputStyle}
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts}
          onChange={(e) => setNewAssignment({ ...newAssignment, attempts: Number(e.target.value) })}
        />
        <textarea
          style={{ ...inputStyle, width: "80%", height: "60px" }}
          placeholder="Descripción del problema"
          value={newAssignment.problem_description}
          onChange={(e) => setNewAssignment({ ...newAssignment, problem_description: e.target.value })}
        />
        <textarea
          style={{ ...inputStyle, width: "80%", height: "40px" }}
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) => setNewAssignment({ ...newAssignment, correct_answer: e.target.value })}
        />
        <button style={buttonStyle} onClick={saveAssignment}>
          Crear
        </button>
      </div>

      {/* ===== Tabla de Asignaciones ===== */}
      <div style={cardStyle}>
        <h2>Asignaciones</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Clase</th>
              <th style={thStyle}>Intentos</th>
              <th style={thStyle}>Imagen</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>{classes.find((c) => c.id === a.class_id)?.name}</td>
                <td style={tdStyle}>{a.attempts}</td>
                <td style={tdStyle}>
                  {a.image_url && <img src={a.image_url} alt="RA" width={50} />}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button style={buttonStyle} onClick={() => handleEditAssignment(a)}>Editar</button>
                    <button style={buttonStyle} onClick={() => deleteAssignment(a.id)}>Eliminar</button>
                    <button style={buttonStyle} onClick={() => handleReviewAssignment(a.id)}>Revisar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Respuestas Estudiantes ===== */}
      {showResponsesFor && (
        <div style={cardStyle}>
          <h2>Respuestas Estudiantes</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Estudiante</th>
                <th style={thStyle}>Respuesta</th>
                <th style={thStyle}>Correcto</th>
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
  );
}
