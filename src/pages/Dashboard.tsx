import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Clock, CheckCircle2, BellRing } from "lucide-react";

interface P {
  id: string; patient_code: string; queue_number: number; nama: string; status: string;
  umur: number|null; jenis_kelamin: string|null; created_at: string;
}

const STATUSES: Record<string, { label: string; cls: string }> = {
  menunggu: { label: "Menunggu", cls: "bg-warning/15 text-warning border-warning/30" },
  dipanggil: { label: "Dipanggil", cls: "bg-primary/15 text-primary border-primary/30" },
  selesai:   { label: "Selesai", cls: "bg-success/15 text-success border-success/30" },
};

export default function Dashboard() {
  const [patients, setPatients] = useState<P[]>([]);

  const load = async () => {
    const { data, error } = await supabase.from("patients").select("*").order("queue_number", { ascending: false });
    if (error) { toast.error("Gagal memuat data"); return; }
    setPatients(data as P[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("dash").on("postgres_changes",
      { event: "*", schema: "public", table: "patients" }, () => load()
    ).subscribe();
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
          <Stat icon={Users} label="Total Pasien" value={counts.total} />
          <Stat icon={Clock} label="Menunggu" value={counts.menunggu} />
          <Stat icon={BellRing} label="Dipanggil" value={counts.dipanggil} />
          <Stat icon={CheckCircle2} label="Selesai" value={counts.selesai} />
        </div>

        <Card className="bg-gradient-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Kode</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Umur</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">L/P</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Belum ada pasien</td></tr>
                ) : patients.map(p => {
                  const s = STATUSES[p.status] ?? STATUSES.menunggu;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/30 transition-smooth">
                      <td className="px-4 py-3 font-bold text-primary">#{p.queue_number}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.patient_code}</td>
                      <td className="px-4 py-3 font-medium">{p.nama}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{p.umur ?? "-"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{p.jenis_kelamin ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          {p.status !== "dipanggil" && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "dipanggil")}>Panggil</Button>}
                          {p.status !== "selesai" && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "selesai")}>Selesai</Button>}
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
