"use client";

import { useState } from "react";
import { Mic, Sparkles, Loader2, CheckCircle2, FileText, Square } from "lucide-react";

const SPECIALTIES = [
  ["CARDIOLOGY", "Cardiology"], ["ONCOLOGY", "Oncology"], ["NEPHROLOGY", "Nephrology"],
  ["NEUROLOGY", "Neurology"], ["GASTROENTEROLOGY", "Gastroenterology"], ["ENDOCRINOLOGY", "Endocrinology"],
  ["GENERAL_PRACTICE", "General Practice"],
] as const;

const NOTE_TYPES = [
  ["SOAP", "SOAP note"], ["CONSULTATION", "Consultation note"], ["DIAGNOSIS", "Diagnosis"],
  ["FOLLOW_UP_PLAN", "Follow-up plan"], ["REFERRAL_LETTER", "Referral letter"], ["DISCHARGE_SUMMARY", "Discharge summary"],
] as const;

/**
 * Ambient AI scribe console. In production the transcript streams from a real-time
 * STT service (Whisper/Deepgram) with speaker diarization; here the doctor can paste
 * or edit a transcript, generate a specialty note, review/edit it, then finalize.
 */
export function ScribeConsole({ doctorName, demoTranscript }: { doctorName: string; demoTranscript: string }) {
  const [specialty, setSpecialty] = useState("NEPHROLOGY");
  const [noteType, setNoteType] = useState("SOAP");
  const [transcript, setTranscript] = useState(demoTranscript);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [engine, setEngine] = useState<string>("");
  const [finalized, setFinalized] = useState(false);

  async function generate() {
    setBusy(true);
    setFinalized(false);
    try {
      const res = await fetch("/api/scribe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, specialty, noteType, doctorName, patientName: "Nimal Perera" }),
      });
      const data = await res.json();
      if (res.ok) {
        setNote(data.note.content);
        setEngine(data.note.engine);
      } else {
        setNote(`Error: ${data.error}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Capture */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Mic className="h-5 w-5 text-brand-600" /> Ambient capture</h2>
            <button
              onClick={() => setRecording((r) => !r)}
              className={`btn px-3 py-1.5 text-xs ${recording ? "bg-danger-500 text-white" : "btn-secondary"}`}
            >
              {recording ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Mic className="h-3.5 w-3.5" /> Record</>}
            </button>
          </div>
          {recording && (
            <p className="mt-2 flex items-center gap-2 text-xs text-danger-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger-500" /> Listening… (demo — transcript editable below)
            </p>
          )}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            className="input mt-3 font-mono text-xs leading-relaxed"
            placeholder="Doctor: …&#10;Patient: …"
          />
          <p className="mt-1 text-xs text-slate-400">Speaker labels (Doctor:/Patient:) drive diarization-aware note structure.</p>
        </div>

        <div className="card">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Specialty</label>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input">
                {SPECIALTIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Note type</label>
              <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="input">
                {NOTE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={busy} className="btn-primary mt-3 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate note
          </button>
        </div>
      </div>

      {/* Review */}
      <div className="card flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-5 w-5 text-brand-600" /> Clinical note</h2>
          {engine && <span className="badge bg-brand-50 text-brand-700">{engine}</span>}
        </div>
        {note ? (
          <>
            <textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); setFinalized(false); }}
              rows={16}
              className="input mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed"
            />
            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => setFinalized(true)} className="btn-primary">
                <CheckCircle2 className="h-4 w-4" /> Approve & finalize
              </button>
              {finalized && <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Finalized & saved to record</span>}
            </div>
            <p className="mt-2 text-xs text-slate-400">Human review required — edit before finalizing. Finalized notes attach to the patient timeline.</p>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center py-16 text-center text-sm text-slate-400">
            Generate a note to review it here.
          </div>
        )}
      </div>
    </div>
  );
}
