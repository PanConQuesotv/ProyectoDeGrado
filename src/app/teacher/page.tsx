"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  role?: string;
}

interface ClassItem {
  id: string;
  name: string;
  created_by?: string;
}

interface Assignment {
  id: string;
  class_id: string;
  title: string;
  image_url?: string | null;
  attempts: number;
  problem_description?: string | null;
  correct_answer?: string | null;
  created_at?: string;
}

interface StudentResponse {
  id: string;
  assignment_id: string;
  student_id: string;
  response?: string | null;
  is_correct?: boolean;
  created_at?: string;
}

export default function TeacherPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>(
    []
  );

  // Selección de clase
  const [selectedClass, setSelectedClass] = useState<string | "">("");

  // Crear clase
  const [newClassName, setNewClassName] = useState("");

  // Crear asignación
  const [newTitle, setNewTitle] = useState("");
  const [newAttempts, setNewAttempts] = useState<number>(1);
  const [newProblem, setNewProblem] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  // Editar asignación
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAttempts, setEditAttempts] = useState<number>(1);
  const [editProblem, setEditProblem] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editClassId, setEditClassId] = useState<string | "">("");

  // Ver asignación
  const [viewing, setViewing] = useState<Assignment | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Fetch
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return console.log(error);
    setProfiles(data || []);
  };

  const fetchClasses = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", user.data.user?.id);
    if (error) return console.log(error);
    setClasses(data || []);
  };

  const fetchAssignments = async (classId?: string) => {
    if (!classId) return setAssignments([]);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) return console.log(error);
    setAssignments(data || []);
  };

  const fetchStudentResponses = async (classId?: string) => {
    if (!classId) return setStudentResponses([]);
    const { data: assignData } = await supabase
      .from("assignments")
      .select("id")
      .eq("class_id", classId);
    const assignIds = (assignData || []).map((a: any) => a.id);
    if (assignIds.length === 0) return setStudentResponses([]);
    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .in("assignment_id", assignIds)
      .order("created_at", { ascending: false });
    if (error) return console.log(error);
    setStudentResponses(data || []);
  };

  useEffect(() => {
    fetchProfiles();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAssignments(selectedClass);
      fetchStudentResponses(selectedClass);
    } else {
      setAssignments([]);
      setStudentResponses([]);
    }
  }, [selectedClass]);

  // Upload
  async function uploadImageToBucket(file: File) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("assignments").getPublicUrl(fileName);
    return data.publicUrl;
  }

  // Crear clase
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return setMessage("Escribe un nombre de clase");
    const user = await supabase.auth.getUser();
    const { error } = await supabase
      .from("classes")
      .insert([{ name: newClassName, created_by: user.data.user?.id }]);
    if (error) return setMessage(error.message);
    setMessage("Clase creada");
    setNewClassName("");
    fetchClasses();
  };

  // Crear asignación
  const handleCreateAssignment = async () => {
    if (!selectedClass) return setMessage("Selecciona clase");
    if (!newTitle.trim()) return setMessage("Agrega un título");
    setLoading(true);
    try {
      let image_url: string | null = null;
      if (newImageFile) image_url = await uploadImageToBucket(newImageFile);
      const { error } = await supabase.from("assignments").insert([
        {
          class_id: selectedClass,
          title: newTitle,
          image_url,
          attempts: newAttempts,
          problem_description: newProblem,
          correct_answer: newAnswer,
        },
      ]);
      if (error) return setMessage(error.message);
      setMessage("Asignación creada");
      setNewTitle("");
      setNewAttempts(1);
      setNewProblem("");
      setNewAnswer("");
      setNewImageFile(null);
      fetchAssignments(selectedClass);
      fetchStudentResponses(selectedClass);
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Editar asignación
  const openEdit = (a: Assignment) => {
    setEditing(a);
    setEditTitle(a.title);
    setEditAttempts(a.attempts || 1);
    setEditProblem(a.problem_description || "");
    setEditAnswer(a.correct_answer || "");
    setEditClassId(a.class_id || "");
    setEditImageFile(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      let image_url = editing.image_url || null;
      if (editImageFile) image_url = await uploadImageToBucket(editImageFile);
      const { error } = await supabase
        .from("assignments")
        .update({
          title: editTitle,
          attempts: editAttempts,
          problem_description: editProblem,
          correct_answer: editAnswer,
          image_url,
          class_id: editClassId,
        })
        .eq("id", editing.id);
      if (error) return setMessage(error.message);
      setMessage("Asignación actualizada");
      setEditing(null);
      fetchAssignments(selectedClass || editClassId);
      fetchStudentResponses(selectedClass || editClassId);
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Ver asignación
  const openView = (a: Assignment) => {
    setViewing(a);
  };

  // Borrar asignación
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("¿Borrar asignación?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
    if (error) return setMessage(error.message);
    setMessage("Asignación borrada");
    fetchAssignments(selectedClass);
    fetchStudentResponses(selectedClass);
  };

  const getStudentName = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name || id;

  return (
    <div style={{ minHeight: "100vh", background: "#0b2f26", color: "#fff", padding: 24 }}>
      <h1>Panel Docente</h1>
      {message && <div style={{ color: "#ffd700", marginBottom: 12 }}>{message}</div>}

      {/* Crear clase */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 10, color: "#000", marginBottom: 18 }}>
        <h3>Crear Clase</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <button className="cta-button" onClick={handleCreateClass}>Crear Clase</button>
        </div>
      </div>

      {/* Seleccionar clase */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 10, color: "#000", marginBottom: 18 }}>
        <h3>Seleccionar Clase</h3>
        <select
          style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Selecciona una clase --</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Crear asignación */}
      {selectedClass && (
        <div style={{ background: "#fff", padding: 16, borderRadius: 10, color: "#000", marginBottom: 18 }}>
          <h3>Crear Asignación</h3>
          <input style={{ width: "100%", marginBottom: 8 }} placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <input style={{ width: "100px", marginBottom: 8 }} type="number" min={1} value={newAttempts} onChange={(e) => setNewAttempts(Number(e.target.value || 1))} placeholder="Intentos" />
          <textarea style={{ width: "100%", height: 80, marginBottom: 8 }} placeholder="Situación problema" value={newProblem} onChange={(e) => setNewProblem(e.target.value)} />
          <textarea style={{ width: "100%", height: 60, marginBottom: 8 }} placeholder="Respuesta correcta" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)} style={{ marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cta-button" onClick={handleCreateAssignment} disabled={loading}>Crear Asignación</button>
            <button className="cta-button" onClick={() => { setNewTitle(""); setNewAttempts(1); setNewProblem(""); setNewAnswer(""); setNewImageFile(null); }}>Limpiar</button>
          </div>
        </div>
      )}

      {/* Lista de asignaciones */}
      {selectedClass && (
        <div style={{ background: "#fff", padding: 16, borderRadius: 10, color: "#000", marginBottom: 18 }}>
          <h3>Asignaciones</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: 6 }}>Título</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 6 }}>Intentos</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 6 }}>Imagen</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: 6 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.attempts}</td>
                  <td>{a.image_url ? <img src={a.image_url} style={{ width: 80 }} /> : "—"}</td>
                  <td>
                    <button className="cta-button" onClick={() => openView(a)}>Ver</button>
                    <button className="cta-button" onClick={() => openEdit(a)}>Editar</button>
                    <button className="cta-button" onClick={() => handleDeleteAssignment(a.id)}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ver Asignación */}
      {viewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", color: "#000", padding: 16, borderRadius: 10, width: 600, maxWidth: "95%" }}>
            <h3>{viewing.title}</h3>
            <p><strong>Intentos:</strong> {viewing.attempts}</p>
            <p><strong>Problema:</strong> {viewing.problem_description}</p>
            <p><strong>Respuesta correcta:</strong> {viewing.correct_answer}</p>
            {viewing.image_url && <img src={viewing.image_url} style={{ width: 200, marginTop: 8 }} />}
            <div style={{ marginTop: 12 }}>
              <button className="cta-button" onClick={() => setViewing(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Asignación */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", color: "#000", padding: 16, borderRadius: 10, width: 600, maxWidth: "95%" }}>
            <h3>Editar Asignación</h3>
            <select style={{ width: "100%", marginBottom: 8 }} value={editClassId} onChange={(e) => setEditClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input style={{ width: "100%", marginBottom: 8 }} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <input style={{ width: "100px", marginBottom: 8 }} type="number" min={1} value={editAttempts} onChange={(e) => setEditAttempts(Number(e.target.value || 1))} />
            <textarea style={{ width: "100%", height: 80, marginBottom: 8 }} value={editProblem} onChange={(e) => setEditProblem(e.target.value)} />
            <textarea style={{ width: "100%", height: 60, marginBottom: 8 }} value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="cta-button" onClick={handleSaveEdit}>Guardar</button>
              <button className="cta-button" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
