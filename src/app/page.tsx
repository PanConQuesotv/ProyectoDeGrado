import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1>
          SIMULADOR DE FRESADORA CNC CON REALIDAD AUMENTADA PARA<br/>
          LA UNIVERSIDAD DE CUNDINAMARCA
        </h1>
        <Link href="/login"><button>Iniciar Sesión</button></Link>
        <Link href="/register"><button>Registrarse</button></Link>
      </div>
    </div>
  );
}
