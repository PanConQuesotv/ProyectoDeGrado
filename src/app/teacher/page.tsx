"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Interfaces (coinciden con tu esquema)
 */
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
  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>(
    []
  );

  // Selected / UI
  const [selectedClass, setSelectedClass] = useState<string | "">("");
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] =
    useState<string | "">("");
  const [selectedStudentFilter, setSelectedStudentFilter] =
    useState<string | "">("");

  // New assignment state
  const [newTitle, setNewTitle] = useState("");
  const [newAttempts, setNewAttempts] = useState<number>(1);
  const [newProblem, setNewProblem] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  // Editing
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAttempts, setEditAttempts] = useState<number>(1);
  const [editProblem, setEditProblem] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editClassId, setEditClassId] = useState<string | "">("");

  // UI feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // ------------ Fetch helpers ------------
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.log("fetchProfiles error", error);
      return;
    }
    setProfiles(data || []);
  };

  const fetchClasses = async () => {
    // traer clases creadas por el docente actual
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", userId);
    if (error) {
      console.log("fetchClasses error", error);
      return;
    }
    setClasses(data || []);
  };

  const fetchAssignments = async (classId?: string) => {
    if (!classId) {
      setAssignments([]);
      return;
    }
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) {
      console.log("fetchAssignments error", error);
      return;
    }
    setAssignments((data as Assignment[]) || []);
  };

  const fetchStudentResponses = async (classId?: string) => {
    if (!classId) {
      setStudentResponses([]);
      return;
    }

    // obtener todas las asignaciones de la clase
    const { data: assignsData, error: aErr } = await supabase
      .from("assignments")
      .select("id")
      .eq("class_id", classId);

    if (aErr) {
      console.log("fetchStudentResponses - assigns error", aErr);
      return;
    }

    const assignIds = (assignsData || []).map((r: any) => r.id);
    if (assignIds.length === 0) {
      setStudentResponses([]);
      return;
    }

    const { data, error } = await supabase
      .from("student_responses")
      .select("*")
      .in("assignment_id", assignIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("fetchStudentResponses error", error);
      return;
    }
    setStudentResponses((data as StudentResponse[]) || []);
  };

  useEffect(() => {
    fetchProfiles();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAssignments(selectedClass);
      fetchStudentResponses(selectedClass);
      setSelectedAssignmentFilter("");
      setSelectedStudentFilter("");
    } else {
      setAssignments([]);
      setStudentResponses([]);
    }
  }, [selectedClass]);

  // ------------ Upload helper ------------
  async function uploadImageToBucket(file: File) {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(fileName, file);

      if (uploadError) {
        console.log("upload error", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("assignments")
        .getPublicUrl(fileName);

      return data.publicUrl as string;
    } catch (err) {
      console.log("uploadImageToBucket err", err);
      throw err;
    }
  }

  // ------------ Create / Update / Delete ------------
  const handleCreateAssignment = async () => {
    if (!selectedClass) {
      setMessage("Selecciona la clase primero.");
      return;
    }
    if (!newTitle.trim()) {
      setMessage("Agrega un título.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      let image_url: string | null = null;
      if (newImageFile) {
        image_url = await uploadImageToBucket(newImageFile);
      }

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

      if (error) {
        setMessage("Error creando asignación: " + error.message);
        console.log("create error", error);
      } else {
        setMessage("Asignación creada");
        // limpiar
        setNewTitle("");
        setNewAttempts(1);
        setNewProblem("");
        setNewAnswer("");
        setNewImageFile(null);
        // refrescar
        await fetchAssignments(selectedClass);
        await fetchStudentResponses(selectedClass);
      }
    } catch (err: any) {
      setMessage("Error subida/creación: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setEditTitle(a.title);
    setEditAttempts(a.attempts || 1);
    setEditProblem(a.problem_description || "");
    setEditAnswer(a.correct_answer || "");
    setEditImageFile(null);
    setEditClassId(a.class_id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setLoading(true);
    setMessage("");

    try {
      let image_url = editing.image_url || null;
      if (editImageFile) {
        image_url = await uploadImageToBucket(editImageFile);
      }

      const { error } = await supabase
        .from("assignments")
        .update({
          title: editTitle,
          image_url,
          attempts: editAttempts,
          problem_description: editProblem,
          correct_answer: editAnswer,
          class_id: editClassId || selectedClass,
        })
        .eq("id", editing.id);

      if (error) {
        setMessage("Error actualizando: " + error.message);
        console.log("update error", error);
      } else {
        setMessage("Asignación actualizada");
        setEditing(null);
        setEditImageFile(null);
        // refrescar
        await fetchAssignments(selectedClass || editClassId || "");
        await fetchStudentResponses(selectedClass || editClassId || "");
      }
    } catch (err: any) {
      setMessage("Error al actualizar: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("¿Borrar asignación?")) return;
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);
    if (error) {
      setMessage("Error borrando: " + error.message);
      console.log("delete error", error);
    } else {
      setMessage("Asignación borrada");
      await fetchAssignments(selectedClass || "");
      await fetchStudentResponses(selectedClass || "");
    }
  };

  // ------------ Filters for responses ------------
  const filteredResponses = studentResponses.filter((r) => {
    if (selectedAssignmentFilter && r.assignment_id !== selectedAssignmentFilter)
      return false;
    if (selectedStudentFilter && r.student_id !== selectedStudentFilter)
      return false;
    return true;
  });

  // Helper to get student display_name
  const getStudentName = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name || id;

  // ------------ JSX / Styles ------------
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0b2f26",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    color: "#fff",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
    width: "95%",
    maxWidth: 1000,
    marginBottom: 18,
    color: "#000",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: 10,
    boxSizing: "border-box",
  };

  const smallInput: React.CSSProperties = {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginRight: 8,
    boxSizing: "border-box",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 8,
  };

  const thStyle: React.CSSProperties = {
    borderBottom: "2px solid #ddd",
    padding: 8,
    textAlign: "left",
  };

  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #eee",
    padding: 8,
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: 6 }}>Panel Docente</h1>

      {message && (
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: "#ffd700" }}>{message}</strong>
        </div>
      )}

      {/* ===== Select class (top) ===== */}
      <div style={cardStyle}>
        <h3>Clases (tus clases)</h3>
        <select
          style={{ ...inputStyle, width: "100%", marginBottom: 12 }}
          value={selectedClass || ""}
          onChange={(e) => setSelectedClass(e.target.value || "")}
        >
          <option value="">-- Selecciona una clase --</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Crear nueva clase (nombre)"
            style={{ ...smallInput, flex: 1 }}
            value={newTitle /* misuse of newTitle to avoid more inputs? */}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            className="cta-button"
            onClick={async () => {
              // create class using newTitle (we reused field)
              if (!newTitle.trim()) {
                setMessage("Escribe un nombre de clase y pulsa Crear Clase");
                return;
              }
              const user = await supabase.auth.getUser();
              const { error } = await supabase
                .from("classes")
                .insert([{ name: newTitle, created_by: user.data.user?.id }]);
              if (error) setMessage("Error crear clase: " + error.message);
              else {
                setMessage("Clase creada");
                setNewTitle("");
                fetchClasses();
              }
            }}
          >
            Crear Clase
          </button>
        </div>
      </div>

      {/* ===== Create assignment (card) ===== */}
      <div style={cardStyle}>
        <h3>Crear Asignación</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
          <input
            style={inputStyle}
            placeholder="Título"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <input
            style={smallInput}
            type="number"
            min={1}
            value={newAttempts}
            onChange={(e) => setNewAttempts(Number(e.target.value || 1))}
            placeholder="Intentos"
          />
        </div>

        <textarea
          style={{ ...inputStyle, height: 100 }}
          placeholder="Situación problema"
          value={newProblem}
          onChange={(e) => setNewProblem(e.target.value)}
        />

        <textarea
          style={{ ...inputStyle, height: 70 }}
          placeholder="Respuesta correcta (código G)"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
        />

        <div style={{ marginBottom: 10 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="cta-button"
            onClick={handleCreateAssignment}
            disabled={loading || !selectedClass}
          >
            {loading ? "Procesando..." : "Crear Asignación"}
          </button>

          <button
            className="cta-button"
            onClick={() => {
              // clear create form quickly
              setNewTitle("");
              setNewAttempts(1);
              setNewProblem("");
              setNewAnswer("");
              setNewImageFile(null);
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ===== Assignments list with edit/delete ===== */}
      <div style={cardStyle}>
        <h3>Asignaciones de la clase</h3>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Título</th>
              <th style={thStyle}>Intentos</th>
              <th style={thStyle}>Imagen</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.title}</td>
                <td style={tdStyle}>{a.attempts}</td>
                <td style={tdStyle}>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.title} style={{ width: 80 }} />
                  ) : (
                    "—"
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="cta-button"
                      onClick={() => openEdit(a)}
                    >
                      Editar
                    </button>
                    <button
                      className="cta-button"
                      onClick={() => handleDeleteAssignment(a.id)}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Responses + filters ===== */}
      <div style={cardStyle}>
        <h3>Respuestas de estudiantes</h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select
            style={smallInput}
            value={selectedAssignmentFilter || ""}
            onChange={(e) => setSelectedAssignmentFilter(e.target.value || "")}
          >
            <option value="">-- Todas las asignaciones --</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          <select
            style={smallInput}
            value={selectedStudentFilter || ""}
            onChange={(e) => setSelectedStudentFilter(e.target.value || "")}
          >
            <option value="">-- Todos los estudiantes --</option>
            {profiles
              .filter((p) => p.role !== "Administrador") // opcional
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.email || p.id}
                </option>
              ))}
          </select>

          <button
            className="cta-button"
            onClick={() => {
              // refetch responses in case something changed
              fetchStudentResponses(selectedClass || "");
            }}
          >
            Refrescar
          </button>
        </div>

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
            {filteredResponses.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>{getStudentName(r.student_id)}</td>
                <td style={tdStyle}>
                  {assignments.find((a) => a.id === r.assignment_id)?.title ||
                    r.assignment_id}
                </td>
                <td style={tdStyle}>{r.response}</td>
                <td style={tdStyle}>{r.is_correct ? "Sí" : "No"}</td>
                <td style={tdStyle}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Edit modal (inline card) ===== */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div style={{ width: 760, maxWidth: "96%", ...cardStyle }}>
            <h3>Editar Asignación</h3>

            <div style={{ display: "flex", gap: 8 }}>
              <select
                style={{ ...smallInput, flex: 1 }}
                value={editClassId || editing.class_id}
                onChange={(e) => setEditClassId(e.target.value)}
              >
                <option value="">-- Clase --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                style={{ ...smallInput, flex: 2 }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <input
                style={{ ...smallInput, width: 120 }}
                type="number"
                min={1}
                value={editAttempts}
                onChange={(e) => setEditAttempts(Number(e.target.value || 1))}
              />
            </div>

            <textarea
              style={{ ...inputStyle, marginTop: 8, height: 110 }}
              value={editProblem}
              onChange={(e) => setEditProblem(e.target.value)}
            />

            <textarea
              style={{ ...inputStyle, marginTop: 8, height: 70 }}
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Imagen actual:</div>
                {editing.image_url ? (
                  <img
                    src={editing.image_url}
                    alt="img"
                    style={{ width: 140, borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: 140, height: 100, border: "1px solid #ddd" }} />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#666" }}>Subir nueva imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                />
                <div style={{ marginTop: 6 }}>
                  <button
                    className="cta-button"
                    onClick={() => {
                      setEditing(null);
                      setEditImageFile(null);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Cancelar
                  </button>
                  <button className="cta-button" onClick={handleSaveEdit}>
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
