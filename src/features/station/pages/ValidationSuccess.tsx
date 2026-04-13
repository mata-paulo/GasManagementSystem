import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Timestamp, doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { recordDispenseTransaction } from "@/lib/data/agas";
import { formatLitersQuantity, roundLiters } from "@/utils/fuelVolume";
import { formatDecodedDate, qrNameCode, type DecodedQR } from "@/lib/qr/qrCodec";
import BottomNav from "@/shared/components/navigation/BottomNav";
import StationDesktopSidebar from "@/shared/components/navigation/StationDesktopSidebar";

type OfficerFuel = {
  uid?: string;
  officerFirstName?: string;
  firstName?: string;
  brand?: string;
  fuelPrices?: Record<string, number>;
};

/** Fallback ₱/L when station has not set a price for that product (aligned with Dashboard mock defaults). */
const DEFAULT_FUEL_PRICES: Record<string, number> = {
  Diesel: 68.25,
  "Premium Diesel": 70.1,
  "Regular/Unleaded (91)": 72.5,
  "Premium (95)": 75.9,
  "Super Premium (97)": 78.4,
};

function pricePerLiterFor(officer: OfficerFuel | undefined, fuelName: string): number {
  const p = officer?.fuelPrices?.[fuelName];
  if (typeof p === "number" && Number.isFinite(p) && p > 0) return p;
  return DEFAULT_FUEL_PRICES[fuelName] ?? 72.5;
}

/** Pesos with centavos always shown (2 decimal places), for labels only. */
function formatPeso(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** For controlled `type="number"` cash field — no grouping so `parseFloat` stays correct. */
function pesoInputString(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** First character uppercase for labels (e.g. motorcycle → Motorcycle). */
function displayVehicleTypeLabel(raw: string): string {
  if (!raw || raw === "---") return raw;
  const t = raw.trim();
  if (!t) return raw;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function isEpochDate(d: Date | null | undefined): boolean {
  if (!d || Number.isNaN(d.getTime())) return true;
  return d.getTime() === 0;
}

function coerceFirestoreDate(raw: unknown): Date | null {
  if (raw == null) return null;
  if (raw instanceof Timestamp) {
    const d = raw.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "object" && raw !== null && "toDate" in raw && typeof (raw as { toDate: () => Date }).toDate === "function") {
    try {
      const d = (raw as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  return null;
}

type ValidationSuccessProps = {
  officer?: OfficerFuel;
  scannedResident?: DecodedQR | null;
  onBack: () => void;
  onLogout: () => void;
  onDispenseSuccess?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function ValidationSuccess({
  officer,
  scannedResident,
  onBack,
  onLogout,
  onDispenseSuccess,
  activeTab,
  onTabChange,
}: ValidationSuccessProps) {
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileRegisteredAt, setProfileRegisteredAt] = useState<Date | null>(null);
  const [accountGasType, setAccountGasType] = useState("");

  const [plateNumber, setPlateNumber] = useState(scannedResident?.plate || "---");
  const [vehicleType, setVehicleType] = useState("---");
  const [fuelConsumed, setFuelConsumed] = useState(scannedResident?.fuelUsed ?? 0);
  const [fuelLimit, setFuelLimit] = useState(scannedResident?.fuelAllocation ?? 20);
  const [accountLoading, setAccountLoading] = useState(false);
  /** Firestore account fetch for names/vehicle: idle → loading → found | miss */
  const [residentAccountLookup, setResidentAccountLookup] = useState<"idle" | "loading" | "found" | "miss">("idle");
  const [residentUid, setResidentUid] = useState<string | null>(scannedResident?.uid ?? null);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    setProfileFirstName(scannedResident?.firstName?.trim() ?? "");
    setProfileLastName(scannedResident?.lastName?.trim() ?? "");
    setAccountGasType("");
    const fromIso = scannedResident?.registeredAt
      ? coerceFirestoreDate(scannedResident.registeredAt)
      : null;
    const fromDecodedDate = scannedResident?.date ? new Date(scannedResident.date) : null;
    const initialReg =
      (fromIso && !isEpochDate(fromIso) ? fromIso : null)
      ?? (fromDecodedDate && !isEpochDate(fromDecodedDate) ? fromDecodedDate : null);
    setProfileRegisteredAt(initialReg);
    setPlateNumber(scannedResident?.plate || "---");
    setVehicleType(scannedResident?.vehicleType?.trim() || "---");
    setFuelConsumed(scannedResident?.fuelUsed ?? 0);
    setFuelLimit(scannedResident?.fuelAllocation ?? 20);
    setResidentUid(scannedResident?.uid ?? null);
    setResidentAccountLookup("idle");
  }, [scannedResident]);

  /** 3-letter QR identity: qrNameCode() = first 3 letters A–Z from each name on file (not from vehicles). */
  const rawFirst = profileFirstName || scannedResident?.firstName || "";
  const rawLast = profileLastName || scannedResident?.lastName || "";
  const legacyFirst = scannedResident?.firstCode?.trim();
  const legacyLast = scannedResident?.lastCode?.trim();
  const nameCodePending =
    residentAccountLookup === "loading" && !rawFirst.trim() && !legacyFirst;
  const nameCodePendingLast =
    residentAccountLookup === "loading" && !rawLast.trim() && !legacyLast;
  const displayFirstQr = rawFirst.trim()
    ? qrNameCode(rawFirst)
    : legacyFirst
      ? qrNameCode(legacyFirst)
      : nameCodePending
        ? "···"
        : "---";
  const displayLastQr = rawLast.trim()
    ? qrNameCode(rawLast)
    : legacyLast
      ? qrNameCode(legacyLast)
      : nameCodePendingLast
        ? "···"
        : "---";
  const vehicleTypeDisplay = displayVehicleTypeLabel(vehicleType);
  const normalizedPlateHint = scannedResident?.plate
    ? scannedResident.plate.replace(/[^A-Z0-9]/gi, "").toUpperCase()
    : "";
  const registeredAtLabel =
    profileRegisteredAt && !isEpochDate(profileRegisteredAt)
      ? formatDecodedDate(profileRegisteredAt)
      : null;

  useEffect(() => {
    const uid = scannedResident?.uid;
    const fName = scannedResident?.firstName;
    const lName = scannedResident?.lastName;
    const qrPlate = scannedResident?.plate;
    if (!uid && !fName && !qrPlate) {
      setAccountLoading(false);
      setResidentAccountLookup("idle");
      return;
    }
    let cancelled = false;
    setAccountLoading(true);
    setResidentAccountLookup("loading");

    const applyData = (docId: string, d: Record<string, unknown>) => {
      setResidentAccountLookup("found");
      setResidentUid(docId);

      // Fill plate/vehicleType from Firestore, matching by the QR plate when available.
      const vehicles = Array.isArray((d as {vehicles?: unknown}).vehicles)
        ? (d as {vehicles: Array<{plate?: unknown; type?: unknown}>}).vehicles
        : [];
      if (!qrPlate) {
        const primary = vehicles[0] && typeof vehicles[0] === "object" ? (vehicles[0] as {plate?: unknown}).plate : null;
        if (typeof primary === "string" && primary.trim()) {
          setPlateNumber(primary.trim().toUpperCase());
        }
      }
      const qrVehicleType = scannedResident?.vehicleType;
      if (!qrVehicleType) {
        const target = (qrPlate || plateNumber || "").trim().toUpperCase();
        const match = target
          ? vehicles.find((v) => typeof v?.plate === "string" && v.plate.trim().toUpperCase() === target)
          : vehicles[0];
        const nextType = match && typeof match === "object" ? (match as {type?: unknown}).type : null;
        if (typeof nextType === "string" && nextType.trim()) {
          setVehicleType(nextType.trim());
        }
      }

      // Fuel allocation/used — prefer per-vehicle values matched by plate.
      const target = (qrPlate || "").trim().toUpperCase();
      const matchedVehicle = target
        ? vehicles.find((v) => typeof v?.plate === "string" && v.plate.trim().toUpperCase() === target)
        : vehicles[0];
      if (matchedVehicle && typeof matchedVehicle === "object") {
        const vAlloc = (matchedVehicle as {fuelAllocated?: unknown}).fuelAllocated;
        const vUsed = (matchedVehicle as {fuelUsed?: unknown}).fuelUsed;
        if (typeof vAlloc === "number" && Number.isFinite(vAlloc)) setFuelLimit(vAlloc);
        if (typeof vUsed === "number" && Number.isFinite(vUsed)) setFuelConsumed(vUsed);
      } else {
        const alloc = typeof d.fuelAllocation === "number" ? d.fuelAllocation : Number(d.fuelAllocation ?? NaN);
        const used = typeof d.fuelUsed === "number" ? d.fuelUsed : Number(d.fuelUsed ?? NaN);
        if (Number.isFinite(alloc)) setFuelLimit(alloc);
        if (Number.isFinite(used)) setFuelConsumed(used);
      }

      const fn = typeof d.firstName === "string" ? d.firstName.trim() : "";
      const ln = typeof d.lastName === "string" ? d.lastName.trim() : "";
      if (fn) setProfileFirstName(fn);
      if (ln) setProfileLastName(ln);
      const reg = coerceFirestoreDate(d.registeredAt);
      if (reg && !isEpochDate(reg)) setProfileRegisteredAt(reg);

      // Only use Firestore gasType if the QR didn't provide one
      const qrGasType = scannedResident?.gasType;
      if (!qrGasType) {
        const vGasType = matchedVehicle && typeof matchedVehicle === "object" ? (matchedVehicle as {gasType?: unknown}).gasType : null;
        if (typeof vGasType === "string" && vGasType.trim()) {
          setAccountGasType(vGasType.trim());
        } else {
          const gt =
            typeof d.gasType === "string"
              ? d.gasType.trim()
              : d.gasType != null
                ? String(d.gasType).trim()
                : "";
          if (gt) setAccountGasType(gt);
        }
      }
    };

    // Lookup priority: uid (direct) → plate (query plateNormalizedList) → name (legacy)
    let fetchAccount: Promise<void>;
    const residentRoleVariants = ["resident", "Resident", "RESIDENT"];
    if (uid) {
      fetchAccount = getDoc(doc(db, "accounts", uid)).then((snap) => {
        if (cancelled) return;
        if (snap.exists()) applyData(snap.id, snap.data());
        else setResidentAccountLookup("miss");
      });
    } else if (qrPlate) {
      const normalized = qrPlate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      fetchAccount = getDocs(query(
        collection(db, "accounts"),
        where("plateNormalizedList", "array-contains", normalized),
        where("role", "in", residentRoleVariants),
        limit(1),
      )).then((snap) => {
        if (cancelled) return;
        if (!snap.empty) applyData(snap.docs[0].id, snap.docs[0].data());
        else setResidentAccountLookup("miss");
      });
    } else {
      fetchAccount = getDocs(query(
        collection(db, "accounts"),
        where("firstName", "==", fName),
        where("lastName", "==", lName),
        where("role", "in", residentRoleVariants),
        limit(1),
      )).then((snap) => {
        if (cancelled) return;
        if (!snap.empty) applyData(snap.docs[0].id, snap.docs[0].data());
        else setResidentAccountLookup("miss");
      });
    }

    fetchAccount
      .catch((err) => {
        console.error("[ValidationSuccess] Failed to fetch account:", err);
        if (!cancelled) setResidentAccountLookup("miss");
      })
      .finally(() => { if (!cancelled) setAccountLoading(false); });
    return () => { cancelled = true; };
  }, [scannedResident?.uid, scannedResident?.firstName, scannedResident?.lastName, scannedResident?.plate]);
  const [literInput, setLiterInput] = useState("");
  const [cashInput, setCashInput] = useState("");
  const [inputMode, setInputMode] = useState<"liters" | "cash">("liters");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const remainingLiters = Math.max(fuelLimit - fuelConsumed, 0);

  const gasTypeFromQR = (accountGasType || scannedResident?.gasType || "").trim();
  const isDieselType = gasTypeFromQR.toLowerCase().includes("diesel");
  const fuelOptionButtons = isDieselType
    ? ["Diesel", "Premium Diesel"]
    : ["Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"];

  const [selectedFuelOption, setSelectedFuelOption] = useState<string>("Regular/Unleaded (91)");

  /** UID-only QR has no gasType until Firestore loads; keep dispense tier aligned with account `gasType`. */
  useEffect(() => {
    const g = (accountGasType || scannedResident?.gasType || "").trim();
    const diesel = g.toLowerCase().includes("diesel");
    const options = diesel
      ? (["Diesel", "Premium Diesel"] as const)
      : (["Regular/Unleaded (91)", "Premium (95)", "Super Premium (97)"] as const);
    let next: string = options[0];
    if (g && (options as readonly string[]).includes(g)) next = g;
    else if (diesel) next = "Diesel";
    else if (g && ["gasoline", "regular"].includes(g.toLowerCase())) next = options[0];
    setSelectedFuelOption((prev) => (prev === next ? prev : next));
  }, [accountGasType, scannedResident?.gasType, scannedResident]);

  const pricePerLiter = useMemo(
    () => pricePerLiterFor(officer, selectedFuelOption),
    [officer, selectedFuelOption],
  );

  const litersFromLiterField = parseFloat(literInput);
  const cashFromCashField = parseFloat(cashInput);

  const maxCashForAllocation = Math.round(remainingLiters * pricePerLiter * 100) / 100;

  useEffect(() => {
    if (inputMode !== "cash") return;
    const c = parseFloat(cashInput);
    if (cashInput.trim() === "" || isNaN(c) || c <= 0 || pricePerLiter <= 0) {
      setLiterInput("");
      return;
    }
    const eff = Math.min(Math.round(c * 100) / 100, maxCashForAllocation);
    if (eff !== c) {
      setCashInput(pesoInputString(eff));
    }
    const L = Math.min(remainingLiters, eff / pricePerLiter);
    setLiterInput(L > 0 ? formatLitersQuantity(L) : "");
  }, [selectedFuelOption, pricePerLiter, remainingLiters, maxCashForAllocation, inputMode]);

  useEffect(() => {
    if (inputMode !== "liters") return;
    const L = parseFloat(literInput);
    if (literInput.trim() === "" || isNaN(L) || L <= 0 || pricePerLiter <= 0) {
      setCashInput("");
      return;
    }
    const Lc = Math.min(L, remainingLiters);
    let cash = Math.round(Lc * pricePerLiter * 100) / 100;
    cash = Math.min(cash, maxCashForAllocation);
    setCashInput(pesoInputString(cash));
    const L2 = Math.min(remainingLiters, cash / pricePerLiter);
    setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
  }, [selectedFuelOption, pricePerLiter, remainingLiters, maxCashForAllocation, inputMode]);

  /** Cash mode: exact amount charged (no ₱ drift from L×price round-trip; cash field is source of truth). */
  const effectiveCash =
    inputMode === "cash" &&
    !isNaN(cashFromCashField) &&
    cashFromCashField > 0
      ? Math.min(Math.round(cashFromCashField * 100) / 100, maxCashForAllocation)
      : 0;

  const litersToDispenseRaw =
    inputMode === "liters"
      ? !isNaN(litersFromLiterField) && litersFromLiterField > 0
        ? Math.min(litersFromLiterField, remainingLiters)
        : 0
      : effectiveCash > 0 && pricePerLiter > 0
        ? Math.min(remainingLiters, effectiveCash / pricePerLiter)
        : 0;
  const litersToDispense = litersToDispenseRaw > 0 ? roundLiters(litersToDispenseRaw) : 0;

  const cashTotalForDispense =
    inputMode === "cash" && effectiveCash > 0
      ? effectiveCash
      : litersToDispense > 0 && pricePerLiter > 0
        ? Math.round(litersToDispense * pricePerLiter * 100) / 100
        : 0;

  const litersLabelForUi = litersToDispense > 0 ? formatLitersQuantity(litersToDispense) : "0";

  const previewDeduct = litersToDispense;
  const previewRemaining = Math.max(remainingLiters - previewDeduct, 0);

  const handleConfirmDispense = async () => {
    if (litersToDispense <= 0) {
      setActionError(
        inputMode === "liters"
          ? "Please enter liters before confirming dispense."
          : "Please enter a valid cash amount before confirming dispense.",
      );
      return;
    }
    if (fuelConsumed + litersToDispense > fuelLimit) {
      setShowLimitModal(true);
      return;
    }
    if (!officer?.uid) {
      setActionError("Station officer account not found. Please re-login.");
      return;
    }
    if (!residentUid) {
      setActionError("Resident account not identified. Cannot record transaction.");
      return;
    }

    setDispensing(true);
    setActionError("");
    try {
      const result = await recordDispenseTransaction({
        stationUid: officer.uid,
        residentUid,
        liters: litersToDispense,
        fuelType: selectedFuelOption,
        plate: plateNumber !== "---" ? plateNumber : undefined,
        vehicleType: vehicleType !== "---" ? vehicleType : undefined,
        scanId: scannedResident?.scanId,
      });
      setFuelConsumed(result.usedLiters);
      onDispenseSuccess?.();
    } catch (err) {
      console.error("[ValidationSuccess] Dispense failed:", err);
      setActionError(err instanceof Error ? err.message : "Failed to record transaction. Please try again.");
    } finally {
      setDispensing(false);
    }
  };

  const switchInputMode = (mode: "liters" | "cash") => {
    if (mode === inputMode) return;
    if (mode === "cash") {
      const L = parseFloat(literInput);
      if (!isNaN(L) && L > 0 && pricePerLiter > 0) {
        const cash = Math.min(Math.round(L * pricePerLiter * 100) / 100, maxCashForAllocation);
        setCashInput(pesoInputString(cash));
        const L2 = Math.min(remainingLiters, cash / pricePerLiter);
        setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
      } else {
        const c = parseFloat(cashInput);
        if (!isNaN(c) && c > 0 && pricePerLiter > 0) {
          const eff = Math.min(Math.round(c * 100) / 100, maxCashForAllocation);
          const L2 = Math.min(remainingLiters, eff / pricePerLiter);
          setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
        }
      }
    } else {
      const c = parseFloat(cashInput);
      if (!isNaN(c) && c > 0 && pricePerLiter > 0) {
        const capped = Math.min(Math.round(c * 100) / 100, maxCashForAllocation);
        const L = Math.min(remainingLiters, capped / pricePerLiter);
        setLiterInput(L > 0 ? formatLitersQuantity(L) : "");
      }
    }
    setInputMode(mode);
    setActionError("");
  };
  /** Pill label follows resident `gasType` (account or QR), not only the dispense sub-product. */
  const displayFuelCategoryIsDiesel = gasTypeFromQR
    ? isDieselType
    : selectedFuelOption.toLowerCase().includes("diesel");
  const displayFuelType = displayFuelCategoryIsDiesel ? "Diesel" : "Gasoline";

  const fuelTypeTheme = displayFuelCategoryIsDiesel
    ? { bgFrom: "#dcfce7", bgTo: "#bbf7d0", border: "#86efac", text: "#166534" }
    : selectedFuelOption.toLowerCase().includes("regular")
      ? { bgFrom: "#fee2e2", bgTo: "#fecaca", border: "#fca5a5", text: "#991b1b" }
      : { bgFrom: "#ffedd5", bgTo: "#fed7aa", border: "#fdba74", text: "#9a3412" };
  const isLow = previewRemaining <= 7;
  const circleColor    = isLow ? "#dc2626" : "#16a34a";
  const allocationBg   = isLow ? "#fef2f2" : "#f0fdf4";
  const allocationBorder = isLow ? "#fca5a5" : "#e5e5eb";
  const textColor      = isLow ? "#dc2626" : "#15803d";
  const textMutedColor = isLow ? "#991b1b" : "#166534";
  const barColor       = isLow ? "#ef4444" : "#16a34a";

  const onConversionPesoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const val = parseFloat(raw);
    let next = raw;
    if (!isNaN(val) && val > maxCashForAllocation) {
      next = pesoInputString(maxCashForAllocation);
    }
    setCashInput(next);
    const c = parseFloat(next);
    if (raw === "" || isNaN(c) || c <= 0 || pricePerLiter <= 0) {
      setLiterInput("");
      setActionError("");
      return;
    }
    const eff = Math.min(Math.round(c * 100) / 100, maxCashForAllocation);
    const L = Math.min(remainingLiters, eff / pricePerLiter);
    setLiterInput(L > 0 ? formatLitersQuantity(L) : "");
    setActionError("");
  };

  const onConversionLiterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (inputMode === "cash") {
      setLiterInput(raw);
      const L = parseFloat(raw);
      if (raw === "" || isNaN(L) || L <= 0 || pricePerLiter <= 0) {
        setCashInput("");
        setActionError("");
        return;
      }
      const Lcapped = Math.min(L, remainingLiters);
      let cash = Math.round(Lcapped * pricePerLiter * 100) / 100;
      cash = Math.min(cash, maxCashForAllocation);
      setCashInput(pesoInputString(cash));
      const LfromCash = Math.min(remainingLiters, cash / pricePerLiter);
      setLiterInput(LfromCash > 0 ? formatLitersQuantity(LfromCash) : "");
      setActionError("");
      return;
    }
    const val = parseFloat(raw);
    let nextL = raw;
    if (!isNaN(val) && val > remainingLiters) {
      nextL = String(remainingLiters);
    }
    setLiterInput(nextL);
    const L = parseFloat(nextL);
    if (raw === "" || isNaN(L) || L <= 0 || pricePerLiter <= 0) {
      setCashInput("");
      setActionError("");
      return;
    }
    const Lc = Math.min(L, remainingLiters);
    let cash = Math.round(Lc * pricePerLiter * 100) / 100;
    if (cash > maxCashForAllocation) {
      cash = maxCashForAllocation;
      setCashInput(pesoInputString(cash));
      const L2 = Math.min(remainingLiters, cash / pricePerLiter);
      setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
    } else {
      setCashInput(pesoInputString(cash));
    }
    setActionError("");
  };

  return (
    <div className="flex min-h-dvh bg-[#eef2f7]">
      <StationDesktopSidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />

      {/* ── Desktop Layout ─────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[#f1f5f9]">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-slate-600" style={{ fontSize: "20px" }}>arrow_back</span>
            </button>
            <div>
              <h1 className="font-headline font-black text-[#003366] text-xl leading-none">Validation Result</h1>
              <p className="text-xs text-slate-400 mt-1">{displayFirstQr} {displayLastQr} · {plateNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
            <div className="w-5 h-5 bg-[#2e7d32] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <span className="text-sm font-black text-[#166534] uppercase tracking-wide">Validated · Transaction Authorized</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left column: Resident Info + Allocation */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="text-outline text-xs font-bold tracking-widest uppercase">Verified Resident</p>
                  {residentAccountLookup === "found" && (rawFirst.trim() || rawLast.trim()) && (
                    <p className="text-[10px] text-slate-400 mt-1">Codes show first 3 letters (A–Z) from each name on file.</p>
                  )}
                  {residentAccountLookup === "miss" && normalizedPlateHint && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                      No account lists plate <span className="font-mono font-bold">{normalizedPlateHint}</span> in{" "}
                      <span className="font-mono">plateNormalizedList</span>. Add it (and a matching vehicle) in Firestore, or regenerate the QR for a plate already on file.
                    </p>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-outline text-[10px] font-bold uppercase tracking-wider">First (code)</p>
                      <p className="font-headline font-black text-2xl text-[#003366] tracking-widest mt-0.5 break-words">{displayFirstQr}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Last (code)</p>
                      <p className="font-headline font-black text-2xl text-[#003366] tracking-widest mt-0.5 break-words">{displayLastQr}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-center">
                    <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Plate Number</p>
                    <p className="font-headline font-black text-5xl text-[#003366] tracking-widest leading-tight mt-1">{plateNumber}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <p className="text-outline text-xs font-bold uppercase tracking-wider">Vehicle Type:</p>
                      <p className="font-headline font-bold text-lg text-on-surface">{vehicleTypeDisplay}</p>
                    </div>
                  </div>

                  {displayFuelType && (
                    <div
                      className="rounded-full border px-5 py-3 flex items-center justify-center gap-2 shadow-sm"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${fuelTypeTheme.bgFrom}, ${fuelTypeTheme.bgTo})`,
                        borderColor: fuelTypeTheme.border,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: fuelTypeTheme.text, fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider leading-none" style={{ color: fuelTypeTheme.text }}>Fuel Type</p>
                        <p className="text-xl font-black leading-tight" style={{ color: fuelTypeTheme.text }}>{displayFuelType}</p>
                      </div>
                    </div>
                  )}

                  {registeredAtLabel && (
                    <p className="text-outline text-xs text-center">Registered: {registeredAtLabel}</p>
                  )}

                  {/* Fuel Allocation */}
                  <div className="rounded-2xl p-4 border overflow-hidden" style={{ background: allocationBg, borderColor: allocationBorder }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: textMutedColor }}>Fuel Allocation</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-lg" style={{ color: textColor, fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                          <p className="text-5xl font-black font-headline leading-none" style={{ color: textColor }}>{previewRemaining.toFixed(1)}</p>
                          <span className="text-2xl" style={{ color: textColor }}>Liters</span>
                        </div>
                        <p className="text-2xl font-bold mt-1" style={{ color: textColor }}>Remaining</p>
                      </div>
                      {(() => {
                        const pct = Math.round((previewRemaining / fuelLimit) * 100);
                        const r = 22;
                        const circ = 2 * Math.PI * r;
                        const dash = (pct / 100) * circ;
                        return (
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 absolute inset-0">
                              <circle cx="32" cy="32" r={r} fill="none" stroke={allocationBorder} strokeWidth="5" />
                              <circle cx="32" cy="32" r={r} fill="none" stroke={circleColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
                            </svg>
                            <div className="relative flex flex-col items-center leading-none">
                              <span className="text-sm font-black" style={{ color: circleColor }}>{pct}%</span>
                              <span className="text-[8px] font-bold uppercase" style={{ color: circleColor }}>Left</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="mt-3 h-4 w-full rounded-full bg-white/70 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{ backgroundColor: barColor, width: `${Math.min((fuelConsumed / fuelLimit) * 100, 100)}%` }}>
                        <span className="text-[9px] font-black text-white whitespace-nowrap">{formatLitersQuantity(fuelConsumed)}L used</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end text-2xl font-bold" style={{ color: textColor }}>
                      <span>Total: {formatLitersQuantity(fuelLimit)} L / week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Dispense */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-outline text-xs font-bold tracking-widest uppercase">Dispense</p>
                    <div className="relative flex w-[220px] gap-1 rounded-xl bg-slate-200/70 p-1 shrink-0">
                      <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#003366] shadow-sm transition-transform duration-300 ease-out ${inputMode === "cash" ? "translate-x-0" : "translate-x-[calc(100%+0.25rem)]"}`} />
                      <button type="button" onClick={() => switchInputMode("cash")}
                        className={`relative z-10 flex-1 rounded-lg py-2 text-[11px] font-black uppercase tracking-wide transition-colors duration-300 ${inputMode === "cash" ? "text-white" : "text-slate-600"}`}>
                        Cash (₱)
                      </button>
                      <button type="button" onClick={() => switchInputMode("liters")}
                        className={`relative z-10 flex-1 rounded-lg py-2 text-[11px] font-black uppercase tracking-wide transition-colors duration-300 ${inputMode === "liters" ? "text-white" : "text-slate-600"}`}>
                        Liters
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className={`grid gap-2 ${isDieselType ? "grid-cols-2" : "grid-cols-3"}`}>
                      {fuelOptionButtons.map((option) => {
                        const active = selectedFuelOption === option;
                        return (
                          <button key={option} type="button"
                            onClick={() => { setSelectedFuelOption(option); setActionError(""); }}
                            className={`rounded-lg border py-2.5 px-2 text-sm font-bold active:scale-95 transition-all ${active ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-[#003366] border-outline-variant/40 hover:bg-slate-50"}`}>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-bold text-[#003366]">₱{formatPeso(pricePerLiter)}</span>
                      <span className="text-outline"> / L</span>
                      {officer?.fuelPrices?.[selectedFuelOption] != null
                        ? <span className="text-outline"> · station price</span>
                        : <span className="text-outline"> · default until set in Fuel &amp; pricing</span>}
                    </p>

                    {remainingLiters <= 0 ? (
                      <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 text-center">
                        No allocation remaining — this resident has used their full weekly limit.
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Conversion</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`relative min-w-0 ${inputMode === "cash" ? "order-1" : "order-2"}`}>
                            <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black ${inputMode === "liters" ? "text-slate-400" : "text-[#003366]"}`}>₱</span>
                            <input type="number" min="0" max={maxCashForAllocation} step="0.01"
                              value={cashInput} onChange={onConversionPesoChange}
                              placeholder={formatPeso(0)} disabled={inputMode === "liters"}
                              className={`w-full rounded-lg border py-3 pl-9 pr-3 outline-none disabled:opacity-100 ${inputMode === "liters" ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-800" : "border-outline-variant/30 bg-white text-on-surface focus:border-[#003366]"}`} />
                          </div>
                          <div className={`relative min-w-0 ${inputMode === "cash" ? "order-2" : "order-1"}`}>
                            <input type="number" min="0" max={remainingLiters}
                              step={inputMode === "liters" ? "0.1" : "any"}
                              value={literInput} onChange={onConversionLiterChange}
                              placeholder="0" disabled={inputMode === "cash"}
                              className={`w-full rounded-lg border py-3 pl-3 pr-10 outline-none disabled:opacity-100 ${inputMode === "cash" ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-800" : "border-outline-variant/30 bg-white text-on-surface focus:border-[#003366]"}`} />
                            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black ${inputMode === "cash" ? "text-slate-400" : "text-[#003366]"}`}>L</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Max ₱{formatPeso(maxCashForAllocation)} · {formatLitersQuantity(remainingLiters)} L allocation</p>

                        {inputMode === "liters" ? (
                          <div className="grid grid-cols-5 gap-2">
                            {[2, 5, 10, 15, 20].map((amount) => {
                              const exceeds = amount > remainingLiters;
                              return (
                                <button key={amount} type="button" disabled={exceeds}
                                  onClick={() => {
                                    if (exceeds) return;
                                    const Lc = Math.min(amount, remainingLiters);
                                    let cash = Math.round(Lc * pricePerLiter * 100) / 100;
                                    if (cash > maxCashForAllocation) {
                                      cash = maxCashForAllocation;
                                      setCashInput(pesoInputString(cash));
                                      const L2 = Math.min(remainingLiters, cash / pricePerLiter);
                                      setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
                                    } else {
                                      setLiterInput(String(Lc));
                                      setCashInput(pesoInputString(cash));
                                    }
                                    setActionError("");
                                  }}
                                  className={`rounded-lg border py-2.5 text-sm font-bold transition-all ${exceeds ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed" : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"}`}>
                                  {amount} L
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {[50, 100, 500, 1000].map((peso) => {
                              const exceeds = peso > maxCashForAllocation;
                              const approxL = pricePerLiter > 0 ? peso / pricePerLiter : 0;
                              return (
                                <button key={peso} type="button" disabled={exceeds}
                                  onClick={() => {
                                    if (exceeds) return;
                                    setCashInput(pesoInputString(peso));
                                    const L = pricePerLiter > 0 ? Math.min(remainingLiters, peso / pricePerLiter) : 0;
                                    setLiterInput(L > 0 ? formatLitersQuantity(L) : "");
                                    setActionError("");
                                  }}
                                  className={`rounded-lg border py-2.5 px-1 text-xs font-bold transition-all leading-tight ${exceeds ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed" : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"}`}>
                                  <span className="block">₱{formatPeso(peso)}</span>
                                  {!exceeds && approxL > 0 && (
                                    <span className="block font-medium text-[9px] text-slate-500 mt-0.5">≈ {formatLitersQuantity(approxL)} L</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {actionError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl">{actionError}</div>
                    )}

                    <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 rounded-r-lg flex gap-3">
                      <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
                      <p className="text-sm text-on-tertiary-fixed-variant leading-tight">
                        Allocation is valid for immediate dispensing at the designated pump station. Please ensure fuel nozzle is securely attached.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button onClick={handleConfirmDispense}
                        disabled={remainingLiters <= 0 || litersToDispense <= 0 || dispensing}
                        className={`w-full font-headline font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${remainingLiters > 0 && litersToDispense > 0 && !dispensing ? "bg-[#2e7d32] text-white active:scale-95 hover:bg-[#1b5e20]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                        <span className="material-symbols-outlined">{dispensing ? "hourglass_top" : "gas_meter"}</span>
                        <span className="flex flex-col items-center leading-tight">
                          <span>{dispensing ? "Processing..." : "Confirm Dispense"}</span>
                          {litersToDispense > 0 && (
                            <span className="text-[11px] font-bold opacity-90 mt-0.5">{litersLabelForUi} L · ₱{formatPeso(cashTotalForDispense)}</span>
                          )}
                        </span>
                      </button>
                      <button onClick={onBack}
                        className="w-full bg-slate-100 text-slate-700 font-headline font-bold py-4 rounded-xl active:scale-95 hover:bg-slate-200 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center text-outline text-xs pb-4">
                  <p>© 2026 Mata Technologies Inc.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile Layout ───────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 bg-surface relative">
      <main
        className="flex-1 pt-2 pb-36 px-4 max-w-md mx-auto w-full"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      >
        <div className=" bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
          {/* Status Header */}
          <div className="p-5 text-center relative"
            style={{ background: "linear-gradient(135deg, #003366 0%, #001e40 100%)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zm20-20h20v20H20V0z' fill='%23003366' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#2e7d32] rounded-full flex items-center justify-center mb-3 shadow-xl">
                <span className="material-symbols-outlined text-3xl text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="font-headline font-black text-white text-xl tracking-tight uppercase">Validated</h2>
              <p className="text-on-primary-container font-medium text-xs mt-0.5">Transaction Authorized</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Resident Identity */}
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <p className="text-outline text-xs font-bold tracking-widest uppercase text-center">Verified Resident</p>
              {residentAccountLookup === "found" && (rawFirst.trim() || rawLast.trim()) && (
                <p className="text-[9px] text-slate-400 text-center px-1">First 3 letters (A–Z) from each name on file.</p>
              )}
              {residentAccountLookup === "miss" && normalizedPlateHint && (
                <p className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2 py-2">
                  No account lists <span className="font-mono font-bold">{normalizedPlateHint}</span> in{" "}
                  <span className="font-mono">plateNormalizedList</span>. Add it in Firestore or use a QR for a registered plate.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-2.5">
                  <p className="text-outline text-[9px] font-bold uppercase tracking-wider">First (code)</p>
                  <p className="font-headline font-black text-xl text-[#003366] tracking-widest break-words">{displayFirstQr}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <p className="text-outline text-[9px] font-bold uppercase tracking-wider">Last (code)</p>
                  <p className="font-headline font-black text-xl text-[#003366] tracking-widest break-words">{displayLastQr}</p>
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <p className="text-outline text-[10px] font-bold uppercase tracking-wider">Plate Number</p>
                <p className="font-headline font-black text-4xl text-[#003366] tracking-widest leading-none mt-1">{plateNumber}</p>
                <p className="text-outline text-xs font-bold uppercase tracking-wider mt-2">Vehicle Type</p>
                <p className="font-headline font-bold text-xl text-on-surface">{vehicleTypeDisplay}</p>
              </div>
              {displayFuelType && (
                <div
                  className="mx-auto w-full max-w-[240px] rounded-full border px-4 py-2 flex items-center justify-center gap-2 shadow-sm"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${fuelTypeTheme.bgFrom}, ${fuelTypeTheme.bgTo})`,
                    borderColor: fuelTypeTheme.border,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: fuelTypeTheme.text, fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                  >
                    local_gas_station
                  </span>
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider leading-none" style={{ color: fuelTypeTheme.text }}>Fuel Type</p>
                    <p className="text-lg font-black leading-tight" style={{ color: fuelTypeTheme.text }}>{displayFuelType}</p>
                  </div>
                </div>
              )}
              {registeredAtLabel && (
                <p className="text-outline text-[11px] text-center">Registered: {registeredAtLabel}</p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-3 sm:p-4 border overflow-hidden"
                style={{ background: allocationBg, borderColor: allocationBorder }}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: textMutedColor }}>Fuel Allocation</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="material-symbols-outlined text-base sm:text-lg" style={{ color: textColor, fontVariationSettings: "'FILL' 1" }}>
                        local_gas_station
                      </span>
                      <p className="text-3xl sm:text-5xl font-black font-headline leading-none" style={{ color: textColor }}>
                        {previewRemaining.toFixed(1)}
                      </p>
                      <span className="text-xl sm:text-3xl" style={{ color: textColor }}>Liters</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold mt-1" style={{ color: textColor }}>Remaining</p>
                  </div>
                  {(() => {
                    const pct = Math.round((previewRemaining / fuelLimit) * 100);
                    const r = 22;
                    const circ = 2 * Math.PI * r;
                    const dash = (pct / 100) * circ;
                    return (
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 absolute inset-0">
                          {/* Track */}
                          <circle cx="32" cy="32" r={r} fill="none" stroke={allocationBorder} strokeWidth="5" />
                          {/* Arc */}
                          <circle
                            cx="32" cy="32" r={r}
                            fill="none"
                            stroke={circleColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circ}`}
                          />
                        </svg>
                        <div className="relative flex flex-col items-center leading-none">
                          <span className="text-sm font-black" style={{ color: circleColor }}>{pct}%</span>
                          <span className="text-[8px] font-bold uppercase" style={{ color: circleColor }}>Left</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 h-3 sm:h-4 w-full rounded-full bg-white/70 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ backgroundColor: barColor, width: `${Math.min((fuelConsumed / fuelLimit) * 100, 100)}%` }}
                  >
                    <span className="text-[8px] sm:text-[9px] font-black text-white whitespace-nowrap">{formatLitersQuantity(fuelConsumed)}L used</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end text-base sm:text-2xl font-bold" style={{ color: textColor }}>

                  <span className="text-right">Total: {formatLitersQuantity(fuelLimit)} L / week</span>
                </div>
              </div>

              {/* Amount input: Liters vs Cash (₱) */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-outline text-[12px] font-bold uppercase tracking-wider">Dispense amount</span>
                  <div className="relative flex w-[min(100%,220px)] gap-1 rounded-xl bg-slate-200/70 p-1 shrink-0">
                    <div
                      className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#003366] shadow-sm transition-transform duration-300 ease-out ${
                        inputMode === "cash" ? "translate-x-0" : "translate-x-[calc(100%+0.25rem)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => switchInputMode("cash")}
                      className={`relative z-10 flex-1 min-w-0 rounded-lg py-2 text-[11px] font-black uppercase tracking-wide transition-colors duration-300 ${
                        inputMode === "cash" ? "text-white" : "text-slate-600"
                      }`}
                    >
                      Cash (₱)
                    </button>
                    <button
                      type="button"
                      onClick={() => switchInputMode("liters")}
                      className={`relative z-10 flex-1 min-w-0 rounded-lg py-2 text-[11px] font-black uppercase tracking-wide transition-colors duration-300 ${
                        inputMode === "liters" ? "text-white" : "text-slate-600"
                      }`}
                    >
                      Liters
                    </button>
                  </div>
                </div>

                <div className={`grid gap-2 ${isDieselType ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}>
                  {fuelOptionButtons.map((option) => {
                    const active = selectedFuelOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedFuelOption(option);
                          setActionError("");
                        }}
                        className={`rounded-lg border py-2.5 px-2 text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                          active
                            ? "bg-[#003366] text-white border-[#003366]"
                            : "bg-white text-[#003366] border-outline-variant/40 hover:bg-slate-50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-600 -mt-1">
                  <span className="font-bold text-[#003366]">₱{formatPeso(pricePerLiter)}</span>
                  <span className="text-outline"> / L</span>
                  {officer?.fuelPrices?.[selectedFuelOption] != null ? (
                    <span className="text-outline"> · station price</span>
                  ) : (
                    <span className="text-outline"> · default until set in Fuel &amp; pricing</span>
                  )}
                </p>

                {remainingLiters <= 0 ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 text-center">
                    No allocation remaining — this resident has used their full weekly limit.
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Conversion</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`relative min-w-0 ${inputMode === "cash" ? "order-1" : "order-2"}`}
                      >
                        <span
                          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black ${
                            inputMode === "liters" ? "text-slate-400" : "text-[#003366]"
                          }`}
                        >
                          ₱
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={maxCashForAllocation}
                          step="0.01"
                          value={cashInput}
                          onChange={onConversionPesoChange}
                          placeholder={formatPeso(0)}
                          disabled={inputMode === "liters"}
                          className={`w-full rounded-lg border py-3 pl-9 pr-3 outline-none disabled:opacity-100 ${
                            inputMode === "liters"
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-800"
                              : "border-outline-variant/30 bg-white text-on-surface focus:border-[#003366]"
                          }`}
                        />
                      </div>
                      <div
                        className={`relative min-w-0 ${inputMode === "cash" ? "order-2" : "order-1"}`}
                      >
                        <input
                          type="number"
                          min="0"
                          max={remainingLiters}
                          step={inputMode === "liters" ? "0.1" : "any"}
                          value={literInput}
                          onChange={onConversionLiterChange}
                          placeholder="0"
                          disabled={inputMode === "cash"}
                          className={`w-full rounded-lg border py-3 pl-3 pr-10 outline-none disabled:opacity-100 ${
                            inputMode === "cash"
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-800"
                              : "border-outline-variant/30 bg-white text-on-surface focus:border-[#003366]"
                          }`}
                        />
                        <span
                          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black ${
                            inputMode === "cash" ? "text-slate-400" : "text-[#003366]"
                          }`}
                        >
                          L
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 -mt-1">
                      Max ₱{formatPeso(maxCashForAllocation)} · {formatLitersQuantity(remainingLiters)} L allocation
                    </p>

                    {inputMode === "liters" ? (
                      <div className="grid grid-cols-5 gap-2">
                        {[2, 5, 10, 15, 20].map((amount) => {
                          const exceeds = amount > remainingLiters;
                          return (
                            <button
                              key={amount}
                              type="button"
                              disabled={exceeds}
                              onClick={() => {
                                if (exceeds) return;
                                const Lc = Math.min(amount, remainingLiters);
                                let cash = Math.round(Lc * pricePerLiter * 100) / 100;
                                if (cash > maxCashForAllocation) {
                                  cash = maxCashForAllocation;
                                  setCashInput(pesoInputString(cash));
                                  const L2 = Math.min(remainingLiters, cash / pricePerLiter);
                                  setLiterInput(L2 > 0 ? formatLitersQuantity(L2) : "");
                                } else {
                                  setLiterInput(String(Lc));
                                  setCashInput(pesoInputString(cash));
                                }
                                setActionError("");
                              }}
                              className={`rounded-lg border py-2.5 text-sm font-bold transition-all ${
                                exceeds
                                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"
                              }`}
                            >
                              {amount} L
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[50, 100, 500, 1000].map((peso) => {
                          const exceeds = peso > maxCashForAllocation;
                          const approxL = pricePerLiter > 0 ? peso / pricePerLiter : 0;
                          return (
                            <button
                              key={peso}
                              type="button"
                              disabled={exceeds}
                              onClick={() => {
                                if (exceeds) return;
                                setCashInput(pesoInputString(peso));
                                const L =
                                  pricePerLiter > 0
                                    ? Math.min(remainingLiters, peso / pricePerLiter)
                                    : 0;
                                setLiterInput(L > 0 ? formatLitersQuantity(L) : "");
                                setActionError("");
                              }}
                              className={`rounded-lg border py-2.5 px-1 text-xs sm:text-sm font-bold transition-all leading-tight ${
                                exceeds
                                  ? "border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-outline-variant/40 bg-white text-[#003366] active:scale-95 hover:bg-slate-50"
                              }`}
                            >
                              <span className="block">₱{formatPeso(peso)}</span>
                              {!exceeds && approxL > 0 && (
                                <span className="block font-medium text-[9px] text-slate-500 mt-0.5">
                                  ≈ {formatLitersQuantity(approxL)} L
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-tertiary-fixed/30 border-l-4 border-tertiary p-4 rounded-r-lg flex gap-3">
              <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
              <p className="text-sm text-on-tertiary-fixed-variant leading-tight">
                Allocation is valid for immediate dispensing at the designated pump station.
                Please ensure fuel nozzle is securely attached.
              </p>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl">
                {actionError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleConfirmDispense}
                disabled={remainingLiters <= 0 || litersToDispense <= 0 || dispensing}
                className={`w-full font-headline font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  remainingLiters > 0 && litersToDispense > 0 && !dispensing
                    ? "bg-[#2e7d32] text-white active:scale-95 active:bg-[#1b5e20]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined">{dispensing ? "hourglass_top" : "gas_meter"}</span>
                <span className="flex flex-col items-center leading-tight">
                  <span>{dispensing ? "Processing..." : "Confirm Dispense"}</span>
                  {litersToDispense > 0 && (
                    <span className="text-[11px] font-bold opacity-90 mt-0.5">
                      {litersLabelForUi} L · ₱{formatPeso(cashTotalForDispense)}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={onBack}
                className="w-full bg-surface-container-high text-on-surface-variant font-headline font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-outline text-xs pb-4">
          <p>© 2026 Mata Technologies Inc.</p>
        </div>
      </main>

      <BottomNav active={activeTab} onChange={onTabChange} />
      </div>
      {/* ── Fuel Limit Modal (shared) ─────────────────────────────────────────── */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="material-symbols-outlined text-red-600"
                  style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
              </div>
              <h3 className="text-xl font-headline font-bold text-[#003366]">Fuel Limit Reached</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                This fuel request exceeds the allowed limit for this resident.
              </p>
              <div className="mt-4 w-full rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p><span className="font-semibold">Consumed:</span> {formatLitersQuantity(fuelConsumed)}L</p>
                <p><span className="font-semibold">Limit:</span> {formatLitersQuantity(fuelLimit)}L</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="mt-5 w-full rounded-xl bg-[#003366] py-3 font-headline font-bold text-white active:scale-95 transition-all"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

