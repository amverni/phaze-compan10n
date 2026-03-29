import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type React from "react";
import { Button } from "../ui/Button/Button";

export const CreateButton: React.FC = () => {
  return (
    <Button as={Link} to="/create" aria-label="Create Game" className="size-14">
      <Plus className="size-8 relative z-10" />
    </Button>
  );
};
