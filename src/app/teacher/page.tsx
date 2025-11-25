"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [newClassName, setNewClassName] = useState("");

  const [newParticipantEmail, setNewParticipantEmail] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    id: "",
    title: "",
    class_id: "",
    attempts: 1,
    problem_description: "",
    correct_answer: "",
    image_url: "",
  });

  const [editingAssignment, setEditingAssignment] = useState(false);

  // ====================== STYLES ======================
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    width: "90%",
    maxWidth: "600px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px",
    width: "80%",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "5px",
  };

  const smallButton: React.CSSProperties = {
    padding: "6px 12px",
    marginRight: "8px",
    background: "#0b5ed7",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
  };

  const dangerButton: React.CSSProperties = {
    ...smallButton,
    background: "#d11a2a",
  };

  // ====================== FETCH CLASSES ======================
  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    setClasses(data || []);
  };

  // ====================== FETCH ASSIGNMENTS ======================
  const fetchAssignments = async () => {
    if (!selectedClass) return;

    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", selectedClass)
      .order("created_at", { ascending: false });

    setAssignments(data || []);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedClass]);

  // ====================== CREATE CLASS ======================
  const createClass = async () => {
    if (!newClassName.trim()) return alert("Escribe el nombre.");

    const { error } = await supabase.from("classes").insert({
      name: newClassName,
    });

    if (!error) {
      alert("Clase creada");
      setNewClassName("");
      fetchClasses();
    }
  };

  // ====================== ADD PARTICIPANT ======================
  const addParticipant = async () => {
    if (!selectedClass) return alert("Selecciona clase.");
    if (!newParticipantEmail.trim()) return alert("Escribe el correo.");

    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newParticipantEmail)
      .single();

    if (!user) return alert("No existe ese usuario.");

    await supabase.from("class_participants").insert({
      class_id: selectedClass,
      user_id: user.id,
    });

    alert("Participante añadido");
    setNewParticipantEmail("");
  };

  // ====================== UPLOAD IMAGE ======================
  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const fileName = `assignment_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(fileName, file);

    if (uploadError) {
      console.log(uploadError);
      alert("Error subiendo imagen");
      return null;
    }

    const { data } = supabase.storage.from("assignments").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ====================== SAVE ASSIGNMENT ======================
  const saveAssignment = async () => {
    if (!newAssignment.class_id) return alert("Selecciona clase");
    if (!newAssignment.title.trim()) return alert("Escribe título");

    if (editingAssignment) {
      await supabase
        .from("assignments")
        .update({
          title: newAssignment.title,
          attempts: newAssignment.attempts,
          problem_description: newAssignment.problem_description,
          correct_answer: newAssignment.correct_answer,
          image_url: newAssignment.image_url,
        })
        .eq("id", newAssignment.id);

      alert("Asignación actualizada");
      setEditingAssignment(false);
    } else {
      await supabase.from("assignments").insert({
        class_id: newAssignment.class_id,
        title: newAssignment.title,
        attempts: newAssignment.attempts,
        problem_description: newAssignment.problem_description,
        correct_answer: newAssignment.correct_answer,
        image_url: newAssignment.image_url,
      });

      alert("Asignación creada correctamente");
    }

    setNewAssignment({
      id: "",
      title: "",
      class_id: "",
      attempts: 1,
      problem_description: "",
      correct_answer: "",
      image_url: "",
    });

    fetchAssignments();
  };

  // ====================== EDIT ASSIGNMENT ======================
  const editAssignment = (a: any) => {
    setEditingAssignment(true);
    setNewAssignment({
      id: a.id,
      title: a.title,
      class_id: a.class_id,
      attempts: a.attempts,
      problem_description: a.problem_description,
      correct_answer: a.correct_answer,
      image_url: a.image_url,
    });
  };

  // ====================== DELETE ASSIGNMENT ======================
  const deleteAssignment = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;

    await supabase.from("assignments").delete().eq("id", id);
    fetchAssignments();
  };

  // ====================== PAGE ======================
  return (
    <div style={{ padding: 20 }}>
      <h1>Teacher Panel</h1>

      {/* ========== CREAR CLASE ========== */}
      <div style={cardStyle}>
        <h2>Crear Clase</h2>
        <input
          style={inputStyle}
          placeholder="Nombre de la clase"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />
        <button style={buttonStyle} onClick={createClass}>
          Crear clase
        </button>
      </div>

      {/* ========== SELECCIONAR CLASE ========== */}
      <div style={cardStyle}>
        <h2>Seleccionar Clase</h2>
        <select
          style={{ ...inputStyle, width: "82%" }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Selecciona...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ========== AÑADIR PARTICIPANTE ========== */}
      <div style={cardStyle}>
        <h2>Añadir Participante</h2>
        <input
          style={inputStyle}
          placeholder="Correo del estudiante"
          value={newParticipantEmail}
          onChange={(e) => setNewParticipantEmail(e.target.value)}
        />
        <button style={buttonStyle} onClick={addParticipant}>
          Añadir
        </button>
      </div>

      {/* ========== CREAR ASIGNACION ========== */}
      <div style={cardStyle}>
        <h2>{editingAssignment ? "Editar Asignación" : "Crear Asignación"}</h2>

        <select
          style={{ ...inputStyle, width: "82%" }}
          value={newAssignment.class_id}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, class_id: e.target.value })
          }
        >
          <option value="">Selecciona clase</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          style={inputStyle}
          placeholder="Título"
          value={newAssignment.title}
          onChange={(e) =>
            setNewAssignment({ ...newAssignment, title: e.target.value })
          }
        />

        <input
          type="number"
          style={inputStyle}
          placeholder="Intentos"
          value={newAssignment.attempts}
          onChange={(e) =>
            setNewAssignment({
              ...newAssignment,
              attempts: Number(e.target.value),
            })
          }
        />

        <textarea
          style={{ ...inputStyle, height: "60px" }}
          placeholder="Descripción"
          value={newAssignment.problem_description}
          onChange={(e) =>
            setNewAssignment({
              ...newAssignment,
              problem_description: e.target.value,
            })
          }
        />

        <textarea
          style={{ ...inputStyle, height: "40px" }}
          placeholder="Respuesta correcta"
          value={newAssignment.correct_answer}
          onChange={(e) =>
            setNewAssignment({
              ...newAssignment,
              correct_answer: e.target.value,
            })
          }
        />

        {/* Imagen */}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadImage(file);
            if (url) {
              setNewAssignment({ ...newAssignment, image_url: url });
              alert("Imagen subida correctamente");
            }
          }}
        />

        {newAssignment.image_url && (
          <img
            src={newAssignment.image_url}
            width={120}
            style={{ marginTop: 10, borderRadius: 10 }}
          />
        )}

        <button style={buttonStyle} onClick={saveAssignment}>
          {editingAssignment ? "Guardar cambios" : "Crear"}
        </button>
      </div>

      {/* ========== TABLA DE ASIGNACIONES ========== */}
      <div style={cardStyle}>
        <h2>Asignaciones</h2>

        {assignments.length === 0 ? (
          <p>No hay asignaciones.</p>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              style={{
                borderBottom: "1px solid #ddd",
                paddingBottom: 10,
                marginBottom: 10,
              }}
            >
              <h3>{a.title}</h3>
              {a.image_url && <img src={a.image_url} width={90} />}

              <div style={{ marginTop: 10 }}>
                <button style={smallButton} onClick={() => editAssignment(a)}>
                  Editar
                </button>
                <button
                  style={dangerButton}
                  onClick={() => deleteAssignment(a.id)}
                >
                  Eliminar
                </button>
                <button
                  style={smallButton}
                  onClick={() => alert("Revisar respuestas pronto")}
                >
                  Revisar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
