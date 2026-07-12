import { createFileRoute } from "@tanstack/react-router";
import {
  decodePhasesCardPayload,
  PhasesCardPage,
  PhasesCardSaveButton,
} from "../../components/PhasesCard";

interface CustomPhasesCardSearch {
  data?: string;
}

export const Route = createFileRoute("/phasescard/custom")({
  validateSearch: (search): CustomPhasesCardSearch => ({
    data: typeof search.data === "string" ? search.data : undefined,
  }),
  component: CustomPhasesCardRoute,
});

function CustomPhasesCardRoute() {
  const { data } = Route.useSearch();
  const decoded = decodePhasesCardPayload(data);

  if (!decoded.ok) {
    return (
      <PhasesCardPage
        topContent={
          <div className="glass rounded-full px-4 py-2 text-sm font-semibold">
            Custom Phases Card
          </div>
        }
        errorMessage={decoded.message}
      />
    );
  }

  return (
    <PhasesCardPage
      topContent={
        <div className="glass max-w-full truncate rounded-full px-4 py-2 text-sm font-semibold">
          {decoded.name}
        </div>
      }
      phases={decoded.phases}
      shareTarget={{ name: decoded.name, phases: decoded.phases }}
      saveAction={
        <PhasesCardSaveButton
          key={`${decoded.name}-${JSON.stringify(decoded.phases)}`}
          name={decoded.name}
          phases={decoded.phases}
        />
      }
    />
  );
}
