import { Upload } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPatientDashboard } from "@/lib/data/patient";
import { isConfigured } from "@/lib/env";
import { RecordsManager, type RecordItem } from "@/components/records/RecordsManager";

export const metadata = { title: "Medical records · XeivoraMed" };

export default async function RecordsPage() {
  const user = await requireUser();
  const data = await getPatientDashboard(user.patientProfileId ?? "demo-patient-profile");

  const initialRecords: RecordItem[] = data.recentRecords.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    recordDate: r.recordDate,
    mimeType: r.mimeType,
    viewUrl: null,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Medical records</h1>
        <span className="hidden items-center gap-1.5 text-sm text-slate-400 sm:inline-flex">
          <Upload className="h-4 w-4" /> Upload reports, prescriptions & scans
        </span>
      </div>

      <RecordsManager initialRecords={initialRecords} s3Enabled={isConfigured.s3} />
    </div>
  );
}
