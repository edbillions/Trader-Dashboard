import { UnicornGrader } from "./unicorn-grader";
import { SessionNotesPanel } from "./session-notes-panel";
import { getSetupGraderSessionData } from "@/lib/data/setup-grader";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function SetupGraderPage() {
  const dateKey = todayKey();
  const data = await getSetupGraderSessionData(dateKey);

  return (
    <UnicornGrader>
      <SessionNotesPanel
        key={dateKey}
        dateKey={dateKey}
        initialBias={data.bias}
        initialNotes={data.notes}
      />
    </UnicornGrader>
  );
}
