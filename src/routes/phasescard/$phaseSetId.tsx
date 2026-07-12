import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PhasesCardPage } from "../../components/PhasesCard";
import { phaseSetDetailOptions } from "../../data/hooks/usePhaseSets";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";

export const Route = createFileRoute("/phasescard/$phaseSetId")({
  component: SpecificPhasesCardRoute,
});

function SpecificPhasesCardRoute() {
  const { phaseSetId } = Route.useParams();
  const { data: phaseSet, isLoading: phaseSetLoading } = useQuery(
    phaseSetDetailOptions(phaseSetId),
  );
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    ...phasesByIdsOptions(phaseSet?.phases ?? []),
    enabled: !!phaseSet,
  });

  const loading = phaseSetLoading || phasesLoading;
  return (
    <PhasesCardPage
      topContent={
        <div className="glass max-w-full truncate rounded-full px-4 py-2 text-sm font-semibold">
          {phaseSet?.name ?? (loading ? "Loading..." : "Phase Set not found")}
        </div>
      }
      phases={phases}
      isLoading={loading}
      errorMessage={!loading && !phaseSet ? "Phase Set not found." : undefined}
      shareTarget={phaseSet ? { name: phaseSet.name, phases, phaseSet } : undefined}
    />
  );
}
