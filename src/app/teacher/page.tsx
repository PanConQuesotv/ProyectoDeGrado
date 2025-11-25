"use client";

import { useEffect, useState, ChangeEvent } from "react";
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
  class_id?: string;
  title: string;
  attempts: number;
  problem_description: string;
  correct_answer: string;
  image?: File | null;
  image_url?: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [newClassName, setNewClassName] = useState("");
  const [newAssignment, setNewAssignment] = useState<Assignment>({
    title: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
    image: null,
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);

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
    if (!newClassName) return alert("Escribe un nombre para la clase.");
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
    if (!selectedClass || !selectedUser) return alert("Selecciona clase y usuario.");
    const { error } = await supabase.from("class_participants").insert([
      { class_id: selectedClass, user_id: selectedUser },
    ]);
    if (error) console.log(error);
    else {
      setSelectedUser(null);
      alert("Participante añadido");
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAssignment({ ...newAssignment, image: e.target.files[0] });
    }
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("assignments")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const createAssignment = async () => {
    if (!newAssignment.title || !newAssignment.problem_description || !selectedClass)
      return alert("Completa todos los campos y selecciona la clase.");

    let image_url = null;
    if (newAssignment.image) {
      const url = await handleImageUpload(newAssignment.image);
      if (!url) return alert("Error subiendo la imagen.");
      image_url = url;
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
      alert("Asignación creada correctamente");
      setNewAssignment({
        title: "",
        attempts: 1,
        problem_description: "",
        correct_answer: "",
        image: null,
      });
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
    marginBottom: "8px",
    background: "#fff",
    color: "#000",
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginRight: "8px",
    marginBottom: "8px",
    width: "200px",
  };

  return (
    <div style={containerStyle}>
      <h1>Panel Docente</h1>

      {/* Crear Clase */}
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

      {/* Añadir Participante */}
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

      {/* Crear Asignación */}
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
          type="text"
          placeholder="Título de la asignación"
          value={newAssignment.title}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, title: e.target.value })
          }
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Número de intentos"
          value={newAssignment.attempts}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, attempts: Number(e.target.value) })
          }
          style={inputStyle}
        />
        <textarea
          placeholder="Situación problema"
          value={newAssignment.problem_description}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, problem_description: e.target.value })
          }
          style={{ ...inputStyle, width: "400px", height: "60px" }}
        />
        <input
          type="text"
          placeholder="Respuesta correcta (código)"
          value={newAssignment.correct_answer}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, correct_answer: e.target.value })
          }
          style={inputStyle}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={inputStyle}
        />
        <button className="cta-button" onClick={createAssignment}>
          Crear Asignación
        </button>

        {/* Lista de Asignaciones */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Clase</th>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Intentos</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>
                  {classes.find((c) => c.id === a.class_id)?.name}
                </td>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>{a.attempts}</td>
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
    </div>
  );
}
