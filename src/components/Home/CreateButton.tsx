import { Button } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type React from "react";

export const CreateButton: React.FC = () => {
  return (
    <Button className="size-16 rounded-full bg-pt-blue-500 text-white font-semibold transition active:translate-y-0.5">
      <Link to="/create" aria-label="Create Game" className="text-5xl leading-none">
        +
      </Link>
    </Button>
  );
};
