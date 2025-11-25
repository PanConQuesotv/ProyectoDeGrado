"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ClassType = {
  id: string;
  name: string;
};

type UserType = {
  id: string;
  email: string;
  display_name: string | null;
};

type AssignmentType = {
  id: string;
  class_id: string;
  title: string;
  image_url: string | null;
  attempts: number;
  problem_description: string;
  correct_answer: string;
  created_at?: string;
};

type StudentResponse = {
  id: string;
  assignment_id: string;
  student_id: string;
  response: string;
  is_correct: boolean;
  created_at: string;
};

export default function TeacherPage() {
  // data
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [participants, setParticipants] = useState<UserType[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);

  // UI / forms
  const [newClassName, setNewClassName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [newAssignment, setNewAssignment] = useState({
    id: "",
    title: "",
    problem_description: "",
    correct_answer: "",
    attempts: 1,
    image_url: "",
  } as Partial<AssignmentType>);
  const [newAssignmentFile, setNewAssignmentFile] = useState<File | null>(null);

  // participant selection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // editing flag
  const [editing, setEditing] = useState(false);

  // styles (kept inline to match current approach)
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100vw",
    background: "#0b2f26",
    display: "flex",
    justifyContent: "center",
    padding: 30,
    boxSizing: "border-box",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 980,
    background: "#fff",
    padding: 28,
    borderRadius: 14,
    boxSizing: "border-box",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 28,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    marginBottom: 10,
    boxSizing: "border-box",
  };

  const subtleBox: React.CSSProperties = {
    background: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const primaryBtn: React.CSSProperties = {
    background: "#0b2f26",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  };

  const actionBtn: React.CSSProperties = {
    width: 100,
    padding: "8px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    color: "#fff",
  };

  const editBtn = { ...actionBtn, background: "orange" };
  const deleteBtn = { ...actionBtn, background: "red" };
  const reviewBtn = { ...actionBtn, background: "#0b2f26" };

  // -------------------------
  // Load initial data
  // -------------------------
  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadParticipants(selectedClass);
      loadAssignments(selectedClass);
    } else {
      setParticipants([]);
      setAssignments([]);
    }
  }, [selectedClass]);

  async function loadClasses() {
    const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
    if (error) console.log("loadClasses:", error);
    else setClasses(data || []);
  }

  async function loadUsers() {
    const { data, error } = await supabase.from("profiles").select("*").order("email", { ascending: true });
    if (error) console.log("loadUsers:", error);
    else setUsers(data || []);
  }

  async function loadParticipants(classId: string) {
    const { data, error } = await supabase
      .from("class_participants")
      .select("user_id, profiles(id,email,display_name)")
      .eq("class_id", classId);
    if (error) {
      console.log("loadParticipants:", error);
      setParticipants([]);
      return;
    }
    // data is array of { user_id, profiles: {...} }
    const parsed = (data || []).map((row: any) => row.profiles).filter(Boolean);
    setParticipants(parsed);
  }

  async function loadAssignments(classId: string) {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) {
      console.log("loadAssignments:", error);
      setAssignments([]);
      return;
    }
    setAssignments(data || []);
  }

  // -------------------------
  // Create class
  // -------------------------
  async function createClass() {
    if (!newClassName.trim()) return alert("Escribe el nombre de la clase");
    const { error } = await supabase.from("classes").insert({ name: newClassName });
    if (error) {
      console.log("createClass:", error);
      alert("Error creando clase");
      return;
    }
    setNewClassName("");
    setSuccessShort("Clase creada correctamente");
    loadClasses();
  }

  // -------------------------
  // Participant selection handlers
  // -------------------------
  function toggleUserSelection(id: string) {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function addSelectedParticipants() {
    if (!selectedClass) return alert("Selecciona una clase primero");
    if (selectedUsers.length === 0) return alert("Marca al menos un usuario");
    const rows = selectedUsers.map((u) => ({ class_id: selectedClass, user_id: u }));
    const { error } = await supabase.from("class_participants").insert(rows);
    if (error) {
      console.log("addSelectedParticipants:", error);
      alert("Error añadiendo participantes");
      return;
    }
    setSelectedUsers([]);
    loadParticipants(selectedClass);
    setSuccessShort("Participantes añadidos correctamente");
  }

  // -------------------------
  // Upload assignment image
  // -------------------------
  async function uploadAssignmentImage(file: File) {
    try {
      const ext = file.name.split(".").pop();
      const fileName = `assignment_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("assignments").upload(fileName, file);
      if (uploadError) {
        console.log("uploadAssignmentImage.uploadError:", uploadError);
        alert("Error subiendo imagen");
        return "";
      }
      const { data } = supabase.storage.from("assignments").getPublicUrl(fileName);
      return data.publicUrl || "";
    } catch (err) {
      console.log("uploadAssignmentImage:", err);
      return "";
    }
  }

  // -------------------------
  // Create / Edit assignment
  // -------------------------
  async function handleSaveAssignment() {
    if (!selectedClass) return alert("Selecciona una clase");
    if (!newAssignment.title || newAssignment.title.trim() === "") return alert("Escribe el título");

    try {
      let uploadedUrl = newAssignment.image_url || "";

      if (newAssignmentFile) {
        const url = await uploadAssignmentImage(newAssignmentFile);
        if (url) uploadedUrl = url;
      }

      const payload = {
        title: newAssignment.title,
        problem_description: newAssignment.problem_description || "",
        correct_answer: newAssignment.correct_answer || "",
        attempts: newAssignment.attempts || 1,
        image_url: uploadedUrl,
        class_id: selectedClass,
      };

      if (editing && newAssignment.id) {
        const { error } = await supabase.from("assignments").update(payload).eq("id", newAssignment.id);
        if (error) throw error;
        setSuccessShort("Asignación actualizada");
      } else {
        const { error } = await supabase.from("assignments").insert(payload);
        if (error) throw error;
        setSuccessShort("Asignación creada correctamente");
      }

      // reset form
      setNewAssignment({
        id: "",
        title: "",
        problem_description: "",
        correct_answer: "",
        attempts: 1,
        image_url: "",
      });
      setNewAssignmentFile(null);
      setEditing(false);
      // reload
      loadAssignments(selectedClass);
    } catch (err) {
      console.log("handleSaveAssignment:", err);
      alert("Ocurrió un error al guardar la asignación");
    }
  }

  function startEditAssignment(a: AssignmentType) {
    setEditing(true);
    setNewAssignment({
      id: a.id,
      title: a.title,
      problem_description: a.problem_description,
      correct_answer: a.correct_answer,
      attempts: a.attempts,
      image_url: a.image_url || "",
    });
    setNewAssignmentFile(null);
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm("¿Eliminar asignación?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      console.log("handleDeleteAssignment:", error);
      alert("Error al eliminar");
      return;
    }
    loadAssignments(selectedClass);
    setSuccessShort("Asignación eliminada");
  }

  // -------------------------
  // Review responses
  // -------------------------
  async function reviewAssignment(id: string) {
    const { data, error } = await supabase.from("student_responses").select("*").eq("assignment_id", id).order("created_at", { ascending: false });
    if (error) {
      console.log("reviewAssignment:", error);
      setResponses([]);
      return;
    }
    setResponses(data || []);
  }

  // small helper to show success temporarily
  function setSuccessShort(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 2500);
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, marginBottom: 12 }}>Panel del Docente</h1>
        {successMsg && (
          <div style={{ background: "#0f5132", color: "#fff", padding: 10, borderRadius: 8, marginBottom: 12 }}>{successMsg}</div>
        )}

        {/* CREATE CLASS */}
        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Crear clase</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input style={{ ...inputStyle, width: "70%" }} placeholder="Nombre de la clase" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
            <button style={primaryBtn} onClick={createClass}>
              Crear
            </button>
          </div>
        </section>

        {/* SELECT CLASS */}
        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Seleccionar clase</h2>
          <select
            style={{ ...inputStyle, width: "50%", padding: "10px 12px" }}
            value={selectedClass}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedClass(id);
            }}
          >
            <option value="">-- Selecciona una clase --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </section>

        {/* ADD PARTICIPANTS */}
        {selectedClass && (
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Añadir participantes</h2>

            <div>
              {users.map((u) => {
                const checked = selectedUsers.includes(u.id);
                return (
                  <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleUserSelection(u.id)} />
                    <div style={{ display: "flex", gap: 12, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.display_name || u.email}</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{u.email}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ marginTop: 10 }}>
              <button style={primaryBtn} onClick={addSelectedParticipants}>
                Añadir seleccionados
              </button>
            </div>

            {/* current participants */}
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: 0 }}>Participantes en esta clase</h4>
              {participants.length === 0 && <div style={{ color: "#777", marginTop: 8 }}>No hay participantes aún.</div>}
              {participants.map((p) => (
                <div key={p.id} style={subtleBox}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.display_name || p.email}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{p.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CREATE / EDIT ASSIGNMENT */}
        {selectedClass && (
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{editing ? "Editar asignación" : "Crear asignación"}</h2>

            <input style={inputStyle} placeholder="Título" value={newAssignment.title || ""} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} />

            <textarea style={{ ...inputStyle, height: 100 }} placeholder="Situación problema" value={newAssignment.problem_description || ""} onChange={(e) => setNewAssignment({ ...newAssignment, problem_description: e.target.value })} />

            <input style={inputStyle} placeholder="Respuesta correcta (código/valor)" value={newAssignment.correct_answer || ""} onChange={(e) => setNewAssignment({ ...newAssignment, correct_answer: e.target.value })} />

            <input style={{ ...inputStyle, width: 200 }} type="number" min={1} placeholder="Intentos" value={newAssignment.attempts || 1} onChange={(e) => setNewAssignment({ ...newAssignment, attempts: Number(e.target.value) })} />

            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Imagen RA (subir archivo)</label>
              <input type="file" accept="image/*" onChange={(e) => setNewAssignmentFile(e.target.files?.[0] || null)} />
              {newAssignment.image_url ? (
                <div style={{ marginTop: 8 }}>
                  <img src={newAssignment.image_url} alt="preview" style={{ width: 120, borderRadius: 8 }} />
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 12 }}>
              <button style={primaryBtn} onClick={handleSaveAssignment}>
                {editing ? "Guardar cambios" : "Crear asignación"}
              </button>
              {editing && (
                <button
                  style={{ marginLeft: 12, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
                  onClick={() => {
                    setEditing(false);
                    setNewAssignment({
                      id: "",
                      title: "",
                      problem_description: "",
                      correct_answer: "",
                      attempts: 1,
                      image_url: "",
                    });
                    setNewAssignmentFile(null);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </section>
        )}

        {/* ASSIGNMENTS LIST */}
        {selectedClass && (
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Asignaciones</h2>

            {assignments.length === 0 && <div style={{ color: "#666" }}>No hay asignaciones para esta clase.</div>}

            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
              {assignments.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "#f7f7f7", borderRadius: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                    {a.image_url && <img src={a.image_url} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8 }} />}
                    <div>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>{a.problem_description}</div>
                      <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>Intentos: {a.attempts}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={editBtn} onClick={() => startEditAssignment(a)}>
                      Editar
                    </button>
                    <button style={deleteBtn} onClick={() => handleDeleteAssignment(a.id)}>
                      Eliminar
                    </button>
                    <button style={reviewBtn} onClick={() => reviewAssignment(a.id)}>
                      Revisar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RESPONSES */}
        {responses.length > 0 && (
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Respuestas de estudiantes (últimas)</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {responses.map((r) => (
                <div key={r.id} style={{ ...subtleBox }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.student_id}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{r.response}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{r.is_correct ? "Correcto" : "Incorrecto"}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
