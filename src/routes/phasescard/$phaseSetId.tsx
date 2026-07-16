import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PhasesCardPage } from "../../components/PhasesCard";
import { phaseSetDetailOptions, phaseSetPhasesStatusOptions } from "../../data/hooks/usePhaseSets";

export const Route = createFileRoute("/phasescard/$phaseSetId")({
  component: SpecificPhasesCardRoute,
});

function SpecificPhasesCardRoute() {
  const { phaseSetId } = Route.useParams();
  const {
    data: phaseSet,
    isError: phaseSetError,
    isLoading: phaseSetLoading,
    refetch: refetchPhaseSet,
  } = useQuery(phaseSetDetailOptions(phaseSetId));
  const {
    data: phaseStatus,
    isError: phasesError,
    isLoading: phasesLoading,
    refetch: refetchPhases,
  } = useQuery({
    ...phaseSetPhasesStatusOptions(phaseSetId),
    enabled: !!phaseSet,
  });
  const phases = phaseStatus?.phases ?? [];

  const loading = phaseSetLoading || phasesLoading;
  const missingPhaseRecords =
    !phasesLoading && !phasesError && (phaseStatus?.missingPhaseRecords ?? false);
  const errorMessage = phaseSetError
    ? "Unable to load Phase Set."
    : phasesError
      ? "Unable to load phases for this Phase Set."
      : !loading && phaseSet === null
        ? "Phase Set not found."
        : missingPhaseRecords
          ? "This Phase Set is missing phase data and cannot be shared."
          : undefined;

  function retryFailedQueries() {
    if (phaseSetError) void refetchPhaseSet();
    if (phasesError) void refetchPhases();
  }

  return (
    <PhasesCardPage
      topContent={
        <div className="glass relative max-w-full truncate rounded-full px-4 py-2 text-sm font-semibold">
          {phaseSet?.name ??
            (phaseSetError ? "Unable to load" : loading ? "Loading..." : "Phase Set not found")}
        </div>
      }
      phases={phases}
      isLoading={loading}
      errorMessage={errorMessage}
      onErrorRetry={phaseSetError || phasesError ? retryFailedQueries : undefined}
      shareTarget={
        phaseSet && !missingPhaseRecords
          ? { source: "phase-set", name: phaseSet.name, phases, phaseSet }
          : undefined
      }
    />
  );
}
