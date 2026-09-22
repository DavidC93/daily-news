import { Verification } from "@/lib/types";
import { VERIFICATION_LABELS } from "@/lib/categories";

export default function VerificationTag({ verification }: { verification: Verification }) {
  if (verification === "confirmed") return null;
  return (
    <span className="text-xs text-accent border border-accent/40 rounded-sm px-1.5 py-0.5 align-middle">
      {VERIFICATION_LABELS[verification]}
    </span>
  );
}
