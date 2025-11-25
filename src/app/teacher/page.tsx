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
  attempts: number;
  problem_description: string;
  correct_answer: string;
  image_url: string;
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<Assignment>({
    id: "",
    class_id: "",
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
    image_url: "",
  });
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);
  const [showResponses, setShowResponses] = useState<string | null>(null); // assignment id

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
    else
      setAssignments(
        data.map((a: any) => ({
          ...a,
          problem_description: a.problem_description || "",
          correct_answer: a.correct_answer || "",
          image_url: a.image_url || "",
        }))
      );
  };

  const fetchStudentResponses = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .eq("assignment_id", assignmentId);
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

  const handleAssignmentInput = (field: keyof Assignment, value: string | number) => {
    setNewAssignment({ ...newAssignment, [field]: value });
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
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

  const saveAssignment = async () => {
    if (!newAssignment.class_id) {
      alert("Selecciona una clase para la asignación");
      return;
    }
    if (!newAssignment.id) {
      // Crear nueva
      const { error } = await supabase.from("assignments").insert([newAssignment]);
      if (error) console.log(error);
    } else {
      // Editar existente
      const { error } = await supabase
        .from("assignments")
        .update({
          title: newAssignment.title,
          attempts: newAssignment.attempts,
          problem_description: newAssignment.problem_description,
          correct_answer: newAssignment.correct_answer,
          image_url: newAssignment.image_url,
        })
        .eq("id", newAssignment.id);
      if (error) console.log(error);
    }
    setNewAssignment({
      id: "",
      class_id: "",
      title: "",
      attempts: 1,
      problem_description: "",
      correct_answer: "",
      image_url: "",
    });
    fetchAssignments();
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setNewAssignment({
      id: assignment.id,
      class_id: assignment.class_id,
      title: assignment.title,
      attempts: assignment.attempts,
      problem_description: assignment.problem_description || "",
      correct_answer: assignment.correct_answer || "",
      image_url: assignment.image_url || "",
    });
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
    if (error) console.log(error);
    else fetchAssignments();
  };

  const handleReviewAssignment = (assignmentId: string) => {
    setShowResponses(assignmentId);
    fetchStudentResponses(assignmentId);
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
    gap: "20px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    color: "#000",
    padding: "20px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "900px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  };

  const thStyle: React.CSSProperties = { borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" };
  const tdStyle: React.CSSProperties = { borderBottom: "1px solid #eee", padding: "8px" };

  const selectStyle: React.CSSProperties = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };

  return (
    <div style={containerStyle}>
      <h1>Panel Docente</h1>

      {/* ===== Crear Clase ===== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="cta-button" onClick={createClass}>
            Crear Clase
          </button>
        </div>
      </div>

      {/* ===== Añadir Participante ===== */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <select style={selectStyle} value={selectedClass || ""} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Selecciona Clase</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select style={selectStyle} value={selectedUser || ""} onChange={(e) => setSelectedUser(e.target.value)}>
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

      {/* ===== Crear / Editar Asignación ===== */}
      <div style={cardStyle}>
        <h2>Crear / Editar Asignación</h2>
        <select
          style={selectStyle}
          value={newAssignment.class_id || ""}
          onChange={(e) => handleAssignmentInput("class_id", e.target.value)}
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
          onChange={(e) => handleAssignmentInput("title", e.target.value)}
        />
        <input
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts}
          onChange={(e) => handleAssignmentInput("attempts", Number(e.target.value))}
        />
        <textarea
          placeholder="Situación problema"
          value={newAssignment.problem_description}
          onChange={(e) => handleAssignmentInput("problem_description", e.target.value)}
        />
        <input
          type="text"
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) => handleAssignmentInput("correct_answer", e.target.value)}
        />
        <input
          type="file"
          onChange={async (e) => {
            if (!e.target.files) return;
            const url = await uploadImage(e.target.files[0]);
            handleAssignmentInput("image_url", url);
          }}
        />
        {newAssignment.image_url && <img src={newAssignment.image_url} alt="RA" style={{ width: "200px" }} />}
        <button className="cta-button" onClick={saveAssignment}>
          Guardar Asignación
        </button>
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
                <td style={tdStyle}>{classes.find((c) => c.id === a.class_id)?.name || ""}</td>
                <td style={tdStyle}>
                  <button className="cta-button" onClick={() => handleEditAssignment(a)}>
                    Editar
                  </button>
                  <button className="cta-button" onClick={() => handleDeleteAssignment(a.id)}>
                    Eliminar
                  </button>
                  <button className="cta-button" onClick={() => handleReviewAssignment(a.id)}>
                    Revisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Revisar Respuestas ===== */}
      {showResponses && (
        <div style={cardStyle}>
          <h2>Respuestas de estudiantes</h2>
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
              {studentResponses.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.student_id}</td>
                  <td style={tdStyle}>{r.response}</td>
                  <td style={tdStyle}>{r.is_correct ? "Sí" : "No"}</td>
                  <td style={tdStyle}>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

