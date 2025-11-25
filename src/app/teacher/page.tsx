"use client";

import { useEffect, useState } from "react";
import supabase from "@/utils/supabaseClient";

type Class = {
  id: string;
  name: string;
};

type User = {
  id: string;
  email: string;
  display_name: string | null;
};

type Assignment = {
  id: string;
  class_id: string;
  title: string;
  image_url: string | null;
  attempts: number;
  problem_description: string;
  correct_answer: string;
};

export default function TeacherPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [users, setUsers] = useState<User[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [newClassName, setNewClassName] = useState("");

  const [successMsg, setSuccessMsg] = useState("");

  // -----------------------------
  // CARGAS INICIALES
  // -----------------------------
  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    setClasses(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
  };

  const loadParticipants = async (classId: string) => {
    const { data } = await supabase
      .from("class_participants")
      .select("user_id, profiles(*)")
      .eq("class_id", classId);

    setParticipants(data?.map((p: any) => p.profiles) || []);
  };

  const loadAssignments = async (classId: string) => {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId);

    setAssignments(data || []);
  };

  // -----------------------------
  // CREAR CLASE
  // -----------------------------
  const createClass = async () => {
    if (!newClassName.trim()) return;

    const { data, error } = await supabase
      .from("classes")
      .insert({ name: newClassName })
      .select()
      .single();

    if (!error) {
      setSuccessMsg("Clase creada correctamente");
      loadClasses();
      setNewClassName("");
      setTimeout(() => setSuccessMsg(""), 2000);
    }
  };

  // -----------------------------
  // AÑADIR PARTICIPANTE
  // -----------------------------
  const addParticipant = async (userId: string) => {
    if (!selectedClass) return;

    await supabase.from("class_participants").insert({
      class_id: selectedClass,
      user_id: userId,
    });

    loadParticipants(selectedClass);
  };

  // -----------------------------
  // CREAR ASIGNACIÓN (NO LO TOCO)
  // -----------------------------
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    problem_description: "",
    correct_answer: "",
    attempts: 1,
    image_url: "",
  });

  const createAssignment = async () => {
    if (!selectedClass) return;

    const { error } = await supabase.from("assignments").insert({
      ...newAssignment,
      class_id: selectedClass,
    });

    if (!error) {
      setSuccessMsg("Asignación creada correctamente");
      loadAssignments(selectedClass);

      setNewAssignment({
        title: "",
        problem_description: "",
        correct_answer: "",
        attempts: 1,
        image_url: "",
      });

      setTimeout(() => setSuccessMsg(""), 2000);
    }
  };

  // -----------------------------
  // BORRAR ASIGNACIÓN
  // -----------------------------
  const deleteAssignment = async (id: string) => {
    await supabase.from("assignments").delete().eq("id", id);
    loadAssignments(selectedClass);
  };

  // -----------------------------
  // UI FINAL
  // -----------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#0b2f26",
        display: "flex",
        justifyContent: "center",
        padding: 30,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 900,
          background: "white",
          padding: 30,
          borderRadius: 20,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
          Panel del Profesor
        </h1>

        {successMsg && (
          <div
            style={{
              background: "#0f5132",
              color: "white",
              padding: "10px 15px",
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {successMsg}
          </div>
        )}

        {/* ------------------ CREAR CLASE ------------------ */}
        <div style={{ marginBottom: 30 }}>
          <h2>Crear Clase</h2>
          <input
            placeholder="Nombre de la clase"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={{
              width: "70%",
              padding: 10,
              marginRight: 10,
            }}
          />
          <button
            onClick={createClass}
            style={{
              padding: "10px 20px",
              background: "#0b2f26",
              color: "white",
              borderRadius: 8,
            }}
          >
            Crear
          </button>
        </div>

        {/* ------------------ SELECCIONAR CLASE ------------------ */}
        <div style={{ marginBottom: 30 }}>
          <h2>Seleccionar Clase</h2>
          <select
            value={selectedClass}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedClass(id);
              loadParticipants(id);
              loadAssignments(id);
            }}
            style={{ padding: 10, width: "80%" }}
          >
            <option value="">Selecciona una clase</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ------------------ AÑADIR PARTICIPANTE ------------------ */}
        {selectedClass && (
          <div style={{ marginBottom: 40 }}>
            <h2>Añadir Participante</h2>

            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#f4f4f4",
                  padding: 10,
                  marginBottom: 5,
                  borderRadius: 8,
                }}
              >
                <span>{u.email}</span>
                <button
                  onClick={() => addParticipant(u.id)}
                  style={{
                    background: "#0b2f26",
                    color: "white",
                    padding: "5px 12px",
                    borderRadius: 6,
                  }}
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ------------------ CREAR ASIGNACIÓN ------------------ */}
        {selectedClass && (
          <div style={{ marginBottom: 40 }}>
            <h2>Crear Asignación</h2>

            <input
              placeholder="Título"
              value={newAssignment.title}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, title: e.target.value })
              }
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />

            <textarea
              placeholder="Descripción del problema"
              value={newAssignment.problem_description}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  problem_description: e.target.value,
                })
              }
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />

            <input
              placeholder="Respuesta correcta"
              value={newAssignment.correct_answer}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  correct_answer: e.target.value,
                })
              }
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />

            <input
              placeholder="URL imagen"
              value={newAssignment.image_url}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  image_url: e.target.value,
                })
              }
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />

            <button
              onClick={createAssignment}
              style={{
                padding: "10px 20px",
                background: "#0b2f26",
                color: "white",
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              Crear Asignación
            </button>
          </div>
        )}

        {/* ------------------ TABLA DE ASIGNACIONES ------------------ */}
        {assignments.length > 0 && (
          <div>
            <h2>Asignaciones</h2>

            {assignments.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 15,
                  background: "#f7f7f7",
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              >
                <strong>{a.title}</strong>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt=""
                      style={{ width: 70, height: 70, borderRadius: 8 }}
                    />
                  )}

                  <button
                    style={{
                      background: "orange",
                      padding: "8px 12px",
                      borderRadius: 6,
                      color: "white",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deleteAssignment(a.id)}
                    style={{
                      background: "red",
                      padding: "8px 12px",
                      borderRadius: 6,
                      color: "white",
                    }}
                  >
                    Eliminar
                  </button>

                  <button
                    style={{
                      background: "#0b2f26",
                      padding: "8px 12px",
                      borderRadius: 6,
                      color: "white",
                    }}
                  >
                    Revisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
