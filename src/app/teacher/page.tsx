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
  image_url: string | null;
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
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
    image_url: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);

  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) console.log(error);
    else setClasses(data);
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
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass]);

  useEffect(() => {
    fetchStudentResponses();
  }, [assignments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const createAssignment = async () => {
    if (!selectedClass || !newAssignment.title) return;

    let image_url = null;
    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Error al subir la imagen: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("assignments")
        .getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const { error } = await supabase.from("assignments").insert([
      {
        class_id: selectedClass,
        title: newAssignment.title,
        attempts: newAssignment.attempts,
        problem_description: newAssignment.problem_description,
        correct_answer: newAssignment.correct_answer,
        image_url,
      },
    ]);

    if (error) console.log(error);
    else {
      setNewAssignment({
        title: "",
        attempts: 1,
        problem_description: "",
        correct_answer: "",
        image_url: null,
      });
      setImageFile(null);
      fetchAssignments();
    }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
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
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
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
      <h1>Panel Docente</h1>

      {/* ===== Seleccionar Clase ===== */}
      <div style={cardStyle}>
        <h2>Seleccionar Clase</h2>
        <select
          style={selectStyle}
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
      </div>

      {/* ===== Crear Asignación ===== */}
      <div style={cardStyle}>
        <h2>Crear Asignación</h2>
        <input
          style={inputStyle}
          type="text"
          placeholder="Título de la asignación"
          value={newAssignment.title || ""}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, title: e.target.value })
          }
        />
        <input
          style={inputStyle}
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts || ""}
          onChange={(e) =>
            setNewAssignment({
              ...newAssignment,
              attempts: parseInt(e.target.value) || 1,
            })
          }
        />
        <textarea
          style={inputStyle}
          placeholder="Situación problema"
          value={newAssignment.problem_description || ""}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, problem_description: e.target.value })
          }
        />
        <textarea
          style={inputStyle}
          placeholder="Respuesta correcta (código G)"
          value={newAssignment.correct_answer || ""}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, correct_answer: e.target.value })
          }
        />
        <input type="file" onChange={handleFileChange} style={{ marginBottom: "10px" }} />
        <button className="cta-button" onClick={createAssignment}>
          Crear Asignación
        </button>

        <h3>Asignaciones existentes</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
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

      {/* ===== Respuestas de Estudiantes ===== */}
      <div style={cardStyle}>
        <h2>Respuestas de Estudiantes</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Estudiante ID</th>
              <th style={thStyle}>Asignación ID</th>
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
