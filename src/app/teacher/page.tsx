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
  image_url?: string;
  attempts: number;
  problem_description: string;
  correct_answer: string;
  created_at: string;
}

interface StudentResponse {
  id: string;
  assignment_id: string;
  student_id: string;
  response: string;
  is_correct: boolean;
  created_at: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);
  const [file, setFile] = useState<File | null>(null);

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
    if (!selectedClass) return setAssignments([]);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", selectedClass);
    if (error) console.log(error);
    else setAssignments(data);
  };

  const fetchStudentResponses = async () => {
    if (!selectedClass) return setStudentResponses([]);
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .in(
        "assignment_id",
        assignments.map((a) => a.id)
      );
    if (error) console.log(error);
    else setStudentResponses(data);
  };

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass]);

  useEffect(() => {
    fetchStudentResponses();
  }, [assignments]);

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
    }
  };

  const addParticipant = async () => {
    if (!selectedClass || !selectedUser) return;
    const { error } = await supabase.from("class_participants").insert([
      { class_id: selectedClass, user_id: selectedUser },
    ]);
    if (error) console.log(error);
    else {
      setSelectedUser(null);
      alert("Participante añadido");
    }
  };

  const createAssignment = async () => {
    if (!selectedClass || !newAssignment.title) return;

    let imageUrl = "";
    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(fileName, file);
      if (uploadError) {
        console.log(uploadError);
        alert("Error al subir la imagen");
        return;
      }
      const { data: urlData } = supabase.storage
        .from("assignments")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("assignments").insert([
      {
        class_id: selectedClass,
        title: newAssignment.title,
        attempts: newAssignment.attempts,
        problem_description: newAssignment.problem_description,
        correct_answer: newAssignment.correct_answer,
        image_url: imageUrl,
      },
    ]);
    if (error) console.log(error);
    else {
      setNewAssignment({
        title: "",
        attempts: 1,
        problem_description: "",
        correct_answer: "",
      });
      setFile(null);
      fetchAssignments();
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);
    if (error) console.log(error);
    else fetchAssignments();
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

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "8px",
    marginBottom: "8px",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#fff" }}>Panel Docente</h1>

      {/* ===== Crear Clase ===== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <input
          type="text"
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          style={inputStyle}
        />
        <button className="cta-button" onClick={createClass}>
          Crear Clase
        </button>
      </div>

      {/* ===== Añadir Participante ===== */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
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

      {/* ===== Crear Asignación ===== */}
      <div style={cardStyle}>
        <h2>Crear Asignación</h2>

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

        <input
          style={inputStyle}
          placeholder="Título de la asignación"
          value={newAssignment.title}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, title: e.target.value })
          }
        />
        <input
          style={inputStyle}
          placeholder="Número de intentos"
          type="number"
          value={newAssignment.attempts}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, attempts: Number(e.target.value) })
          }
        />
        <textarea
          style={inputStyle}
          placeholder="Situación problema"
          value={newAssignment.problem_description}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, problem_description: e.target.value })
          }
        />
        <input
          style={inputStyle}
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, correct_answer: e.target.value })
          }
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          style={{ marginBottom: "8px" }}
        />
        <button className="cta-button" onClick={createAssignment}>
          Crear Asignación
        </button>

        <h3>Asignaciones</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Intentos</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>{a.attempts}</td>
                <td style={tdStyle}>
                  <button className="cta-button" onClick={() => deleteAssignment(a.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Respuestas Estudiantes ===== */}
      <div style={cardStyle}>
        <h2>Respuestas de Estudiantes</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Estudiante</th>
              <th style={thStyle}>Asignación</th>
              <th style={thStyle}>Respuesta</th>
              <th style={thStyle}>Correcta</th>
              <th style={thStyle}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {studentResponses.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>{r.student_id}</td>
                <td style={tdStyle}>{r.assignment_id}</td>
                <td style={tdStyle}>{r.response}</td>
                <td style={tdStyle}>{r.is_correct ? "Sí" : "No"}</td>
                <td style={tdStyle}>{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
