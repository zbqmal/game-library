import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Game Library</h1>
      <ul>
        <li key="up-and-down">
          <Link href={`/games/upAndDown`}>{"Up And Down"}</Link>
        </li>
        <li key="to-be-determined">{"TBD.."}</li>
      </ul>
    </div>
  );
}
