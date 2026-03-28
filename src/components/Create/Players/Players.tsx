import { Link } from "@tanstack/react-router";

export function Players() {
  return (
    <div>
      <p>Players</p>
      <Link to="/create/phases">Next: Phases</Link>
    </div>
  );
}
