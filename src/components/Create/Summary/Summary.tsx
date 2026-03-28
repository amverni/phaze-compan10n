import { Link } from "@tanstack/react-router";

export function Summary() {
  return (
    <div>
      <p>Summary</p>
      <Link to="/create/players">Edit Players</Link>
      <Link to="/create/phases">Edit Phases</Link>
    </div>
  );
}
