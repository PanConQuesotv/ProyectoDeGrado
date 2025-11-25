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
  id?: string;
  class_id: string;
  title: string;
  image_url?: string;
  attempts: number;
  problem_description: string;
  correct_answer: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newClassName, setNewClassName] = useState("");
  const [newAssignment, setNewAssignment] = useState<Assignment>({
    class_id: "",
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      setSelectedUser("");
      alert("Participante añadido");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]);
  };

  const createAssignment = async () => {
    if (!selectedClass || !newAssignment.title) {
      alert("Selecciona la clase y pon un título");
      return;
    }

    let image_url = "";
    if (imageFile) {
      const fileName = `assignment_${Date.now()}_${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from("assignments")
        .upload(fileName, imageFile);

      if (error) {
        console.log(error);
        alert("Error subiendo la imagen");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("assignments")
        .getPublicUrl(fileName);

      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("assignments").insert([
      {
        ...newAssignment,
        class_id: selectedClass,
        image_url,
      },
    ]);

    if (error) console.log(error);
    else {
      setNewAssignment({
        class_id: "",
        title: "",
        attempts: 1,
        problem_description: "",
        correct_answer: "",
      });
      setImageFile(null);
      fetchAssignments();
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
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
    marginRight: "8px",
    marginBottom: "8px",
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

        <select
          style={selectStyle}
          value={selectedUser}
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

        <input
          style={inputStyle}
          type="text"
          placeholder="Título de la asignación"
          value={newAssignment.title}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, title: e.target.value })
          }
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: "8px" }}
        />

        <input
          style={inputStyle}
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, attempts: Number(e.target.value) })
          }
        />

        <textarea
          placeholder="Situación problema"
          value={newAssignment.problem_description}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, problem_description: e.target.value })
          }
          style={{ ...inputStyle, height: "80px" }}
        />

        <textarea
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, correct_answer: e.target.value })
          }
          style={{ ...inputStyle, height: "60px" }}
        />

        <button className="cta-button" onClick={createAssignment}>
          Crear Asignación
        </button>
      </div>

      {/* ===== Asignaciones existentes ===== */}
      {selectedClass && (
        <div style={cardStyle}>
          <h2>Asignaciones de la clase</h2>
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
                    <button
                      className="cta-button"
                      onClick={() => deleteAssignment(a.id!)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
