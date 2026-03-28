import { Button } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type React from "react";

export const CreateButton: React.FC = () => {
  return (
    <Button className="mb-2.5 size-16 rounded-full bg-pt-blue-500 text-white font-semibold shadow-[0_6px_4px_rgba(0,0,0,0.4),0_2px_2px_rgba(0,0,0,0.3)] transition active:translate-y-0.5 active:shadow-[0_3px_2px_rgba(0,0,0,0.35),0_1px_1px_rgba(0,0,0,0.2)]">
      <Link to="/create" aria-label="Create Game" className="text-5xl leading-none">
        +
      </Link>
    </Button>
  );
};
