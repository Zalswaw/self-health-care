import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Clock, CheckCircle2, BellRing, Printer, X } from "lucide-react";
import JsBarcode from "jsbarcode";

interface P {
  id: string; patient_code: string; queue_number: number;
  nama: string; status: string; umur: number | null;
  jenis_kelamin: string | null; keluhan: string | null; created_at: string;
}

const STATUSES: Record<string, { label: string; cls: string }> = {
  menunggu:  { label: "Menunggu",  cls: "bg-warning/15 text-warning border-warning/30" },
  dipanggil: { label: "Dipanggil", cls: "bg-primary/15 text-primary border-primary/30" },
  selesai:   { label: "Selesai",   cls: "bg-success/15 text-success border-success/30" },
};

function makeBarcodesvg(value: string) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(el, value, { format: "CODE128", width: 1.5, height: 60, fontSize: 12, margin: 4, lineColor: "#000" });
  return new XMLSerializer().serializeToString(el);
}

function doPrint(p: P) {
  const win = window.open("", "_blank", "width=400,height=700");
  if (!win) return;
  const bar = makeBarcodesvg(p.patient_code);
  const now = new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  win.document.write(`<!DOCTYPE html><html><head><title>Struk</title><style>
    @page{size:58mm auto;margin:0}*{box-sizing:border-box;margin:0;padding:0}
    body{width:58mm;padding:3mm 4mm;font-family:'Courier New',monospace;font-size:12px;color:#000;background:#fff}
    .c{text-align:center}.d{border-top:1px dashed #000;margin:2.5mm 0}
    .lbl{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#333}
    .q{font-size:48px;font-weight:900;line-height:1}
    .code{font-size:14px;font-weight:700}.name{font-size:13px;font-weight:600}
    .sm{font-size:11px;color:#444}.bar{display:flex;justify-content:center;margin:2mm 0}
    .bar svg{display:block}
  </style></head><body>
    <div class="c" style="margin-bottom:3mm">
      <div style="font-weight:900;font-size:15px;text-transform:uppercase">SELF HEALTY CARE</div>
      <div class="sm">Pendaftaran Pasien</div>
    </div>
    <div class="d"></div>
    <div class="c" style="margin:2.5mm 0">
      <div class="lbl">NOMOR ANTRIAN</div><div class="q">${p.queue_number}</div>
    </div>
    <div class="d"></div>
    <div class="c" style="margin:2.5mm 0">
      <div class="lbl">KODE PASIEN</div>
      <div class="code" style="margin-top:1mm">${p.patient_code}</div>
      <div class="name" style="margin-top:1mm">${p.nama}</div>
      ${p.umur ? `<div class="sm" style="margin-top:1mm">${p.umur} thn · ${p.jenis_kelamin ?? "-"}</div>` : ""}
      ${p.keluhan ? `<div class="lbl" style="margin-top:2mm">Keluhan</div><div class="sm">${p.keluhan}</div>` : ""}
    </div>
    <div class="d"></div>
    <div class="bar">${bar}</div>
    <div class="d"></div>
    <div class="sm">Tunjukkan struk ini ke dokter saat dipanggil.</div>
    <div class="sm" style="margin-top:1mm">${now}</div>
    <div class="c sm" style="margin-top:3mm;font-style:italic">--- SEHAT SELALU ---</div>
  </body></html>`);
  win.document.close();
  win.onload = () => win.print();
}

export default function Dashboard() {
  const [patients, setPatients] = useState<P[]>([]);
  const [printTarget, setPrintTarget] = useState<P | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("patients").select("*").order("queue_number", { ascending: false });
    if (error) { toast.error("Gagal memuat data"); return; }
    setPatients(data as P[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("patients").update({ status }).eq("id", id);
    if (error) toast.error("Gagal");
  };

  const counts = {
    total: patients.length,
    menunggu: patients.filter(p => p.status === "menunggu").length,
    dipanggil: patients.filter(p => p.status === "dipanggil").length,
    selesai: patients.filter(p => p.status === "selesai").length,
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Monitoring</h1>
          <p className="text-muted-foreground">Pantau status antrian pasien secara realtime.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat icon={Users}        label="Total Pasien" value={counts.total} />
          <Stat icon={Clock}        label="Menunggu"     value={counts.menunggu} />
          <Stat icon={BellRing}     label="Dipanggil"    value={counts.dipanggil} />
          <Stat icon={CheckCircle2} label="Selesai"      value={counts.selesai} />
        </div>

        <Card className="bg-gradient-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  {["No","Kode","Nama","Umur","L/P","Keluhan","Status","Aksi"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold${i === 3 || i === 4 ? " hidden md:table-cell" : ""}${i === 5 ? " hidden lg:table-cell" : ""}${i === 7 ? " text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Belum ada pasien</td></tr>
                ) : patients.map(p => {
                  const s = STATUSES[p.status] ?? STATUSES.menunggu;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/30 transition-smooth">
                      <td className="px-4 py-3 font-bold text-primary">#{p.queue_number}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.patient_code}</td>
                      <td className="px-4 py-3 font-medium">{p.nama}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{p.umur ?? "-"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{p.jenis_kelamin ?? "-"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell max-w-[180px]">
                        <span className="text-xs text-muted-foreground line-clamp-2">{p.keluhan ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={s.cls}>{s.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          {p.status !== "dipanggil" && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "dipanggil")}>Panggil</Button>}
                          {p.status !== "selesai"   && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "selesai")}>Selesai</Button>}
                          <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/10" onClick={() => setPrintTarget(p)}>
                            <Printer className="h-3.5 w-3.5 mr-1" />Cetak
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Print Modal */}
      {printTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full mx-4">
            <button onClick={() => setPrintTarget(null)} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <h2 className="text-base font-bold mb-1">Cetak Struk</h2>
            <p className="text-xs text-gray-500 mb-3">Pasien: <span className="font-mono font-semibold">{printTarget.patient_code}</span> — {printTarget.nama}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPrintTarget(null)}>Batal</Button>
              <Button className="flex-1 bg-gradient-hero" onClick={() => { doPrint(printTarget); setPrintTarget(null); }}>
                <Printer className="h-4 w-4 mr-2" />Cetak
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5 bg-gradient-card shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
        </div>
        <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
