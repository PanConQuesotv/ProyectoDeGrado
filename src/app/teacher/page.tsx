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
  title: string;
  class_id: string;
  image_url?: string;
  attempts: number;
  problem_description: string;
  correct_answer: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Nueva asignación
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
  });
  const [assignmentImage, setAssignmentImage] = useState<File | null>(null);

  const [newClassName, setNewClassName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const fetchAssignments = async () => {
    if (!selectedClass) return setAssignments([]);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", selectedClass);
    if (error) console.log(error);
    else setAssignments(data as Assignment[]);
  };

  useEffect(() => {
    fetchClasses();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssignmentImage(e.target.files[0]);
    }
  };

  const createAssignment = async () => {
    if (!selectedClass) {
      setMessage("Selecciona primero una clase.");
      return;
    }
    if (!newAssignment.title || !newAssignment.problem_description || !newAssignment.correct_answer) {
      setMessage("Completa todos los campos.");
      return;
    }

    setLoading(true);
    setMessage("");

    let image_url: string | undefined = undefined;

    // Subida de imagen
    if (assignmentImage) {
      const fileName = `${Date.now()}_${assignmentImage.name}`;
      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(fileName, assignmentImage);

      if (uploadError) {
        setMessage("Error al subir imagen: " + uploadError.message);
        setLoading(false);
        return;
      }

      // Obtener URL pública
      const { data, error: urlError } = supabase.storage
        .from("assignments")
        .getPublicUrl(fileName);

      if (urlError) {
        setMessage("Error al obtener URL: " + urlError.message);
        setLoading(false);
        return;
      }

      image_url = data.publicUrl;
    }

    const { error } = await supabase.from("assignments").insert([
      {
        class_id: selectedClass,
        title: newAssignment.title,
        attempts: newAssignment.attempts || 1,
        problem_description: newAssignment.problem_description,
        correct_answer: newAssignment.correct_answer,
        image_url,
      },
    ]);

    if (error) setMessage(error.message);
    else {
      setNewAssignment({ title: "", attempts: 1, problem_description: "", correct_answer: "" });
      setAssignmentImage(null);
      fetchAssignments();
      setMessage("Asignación creada correctamente.");
    }
    setLoading(false);
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

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    width: "100%",
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
        <button className="cta-button" onClick={createClass}>
          Crear Clase
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
          value={newAssignment.attempts || 1}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, attempts: parseInt(e.target.value) })
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
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer || ""}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, correct_answer: e.target.value })
          }
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button className="cta-button" onClick={createAssignment} disabled={loading}>
          {loading ? "Creando..." : "Crear Asignación"}
        </button>
        {message && <p>{message}</p>}
      </div>

      {/* ===== Lista de Asignaciones ===== */}
      <div style={cardStyle}>
        <h2>Asignaciones</h2>
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
    </div>
  );
}
