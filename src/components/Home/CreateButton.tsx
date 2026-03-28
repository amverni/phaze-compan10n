import { Plus } from "lucide-react";
import type React from "react";
import { Button } from "../ui/Button/Button";

export const CreateButton: React.FC = () => {
  return <Button as="link" to="/create" aria-label="Create Game" size="regular" icon={Plus} />;
};
