import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Barcode from "@/components/Barcode";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cpu, Download, Printer, RefreshCw, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  alamat: z.string().trim().max(300).optional(),
  pekerjaan: z.string().trim().max(100).optional(),
  umur: z.coerce.number().int().min(0).max(150).optional(),
  jenis_kelamin: z.string().optional(),
  keluhan: z.string().trim().max(500).optional(),
  riwayat_penyakit: z.string().trim().max(500).optional(),
  alergi: z.string().trim().max(300).optional(),
  tinggi_badan: z.coerce.number().min(0).max(300).optional(),
  berat_badan: z.coerce.number().min(0).max(500).optional(),
  suhu_tubuh: z.coerce.number().min(0).max(50).optional(),
});

interface Result {
  patient_code: string;
  queue_number: number;
  nama: string;
}

export default function Daftar() {
  const [form, setForm] = useState<Record<string, string>>({
    nama: "", alamat: "", pekerjaan: "", umur: "", jenis_kelamin: "",
    keluhan: "", riwayat_penyakit: "", alergi: "", tinggi_badan: "", berat_badan: "", suhu_tubuh: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const fetchEsp = async () => {
    try {
      const { data, error } = await supabase
        .from("esp_readings")
        .select("*").eq("consumed", false)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setForm((f) => ({
          ...f,
          tinggi_badan: data.tinggi_badan?.toString() ?? f.tinggi_badan,
          berat_badan: data.berat_badan?.toString() ?? f.berat_badan,
          suhu_tubuh: data.suhu_tubuh?.toString() ?? f.suhu_tubuh,
        }));
        toast.success("Data sensor IoT dimuat");
      } else {
        toast.info("Belum ada data sensor baru");
      }
    } catch (e) {
      toast.error("Gagal mengambil data sensor");
    }
  };

  useEffect(() => {
    // auto pull latest reading on mount
    fetchEsp();
    // realtime subscription for new ESP readings
    const ch = supabase.channel("esp-form")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "esp_readings" },
        (payload) => {
          const r: any = payload.new;
          setForm((f) => ({
            ...f,
            tinggi_badan: r.tinggi_badan?.toString() ?? f.tinggi_badan,
            berat_badan: r.berat_badan?.toString() ?? f.berat_badan,
            suhu_tubuh: r.suhu_tubuh?.toString() ?? f.suhu_tubuh,
          }));
          toast.success("Sensor baru terdeteksi — form diperbarui");
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      // generate code & queue via simple count
      const { count } = await supabase.from("patients").select("*", { count: "exact", head: true });
      const next = (count ?? 0) + 1;
      const patient_code = `PASIEN-${String(next).padStart(3, "0")}`;
      const queue_number = next;

      const payload: any = { patient_code, queue_number, nama: parsed.data.nama };
      for (const k of ["alamat","pekerjaan","umur","jenis_kelamin","keluhan","riwayat_penyakit","alergi","tinggi_badan","berat_badan","suhu_tubuh"] as const) {
        const v = (parsed.data as any)[k];
        if (v !== undefined && v !== "" && !Number.isNaN(v)) payload[k] = v;
      }

      const { data, error } = await supabase.from("patients").insert(payload).select().single();
      if (error) throw error;

      // mark esp readings consumed
      await supabase.from("esp_readings").update({ consumed: true }).eq("consumed", false);

      setResult({ patient_code: data.patient_code, queue_number: data.queue_number, nama: data.nama });
      toast.success("Pendaftaran berhasil!");
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadBarcode = () => {
    const svg = document.querySelector<SVGSVGElement>("#patient-barcode svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${result?.patient_code}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const printBarcode = () => window.print();

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div>
          <Header />
          <main className="container py-10 max-w-2xl">
            <Card className="p-8 bg-gradient-card shadow-card text-center space-y-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pendaftaran Berhasil</h2>
                <p className="text-muted-foreground">Selamat datang, {result.nama}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="text-xs text-muted-foreground">Nomor Antrian</div>
                  <div className="text-3xl font-bold text-primary">{result.queue_number}</div>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="text-xs text-muted-foreground">Kode Pasien</div>
                  <div className="text-sm font-mono font-semibold mt-1">{result.patient_code}</div>
                </div>
              </div>
              <div id="patient-barcode" className="bg-white rounded-xl p-4 inline-block shadow-soft">
                <Barcode value={result.patient_code} />
              </div>
              <p className="text-sm text-muted-foreground">Tunjukkan barcode ini ke dokter saat dipanggil.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={downloadBarcode} variant="outline"><Download className="h-4 w-4 mr-2" />Download</Button>
                <Button onClick={printBarcode} variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
                <Button onClick={() => { setResult(null); setForm({ nama:"",alamat:"",pekerjaan:"",umur:"",jenis_kelamin:"",keluhan:"",riwayat_penyakit:"",alergi:"",tinggi_badan:"",berat_badan:"",suhu_tubuh:"" }); }} className="bg-gradient-hero">Pasien Baru</Button>
              </div>
            </Card>
          </main>
        </div>

        {/* 58mm Thermal Print Layout — only visible when printing */}
        <div id="print-receipt" className="hidden print:block" style={{ width: '58mm', margin: '0 auto', padding: '2mm 3mm', fontFamily: 'monospace', color: '#000', background: '#fff', fontSize: '10px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
            <div style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>SELF HEALTY CARE</div>
            <div style={{ fontSize: '9px', color: '#333', marginTop: '1mm' }}>Pendaftaran Pasien</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

          {/* Queue Number */}
          <div style={{ textAlign: 'center', margin: '2mm 0' }}>
            <div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#444' }}>NOMOR ANTRIAN</div>
            <div style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.1, color: '#000' }}>{result.queue_number}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

          {/* Patient Info */}
          <div style={{ textAlign: 'center', margin: '2mm 0' }}>
            <div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#444' }}>KODE PASIEN</div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', marginTop: '1mm' }}>{result.patient_code}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '1.5mm' }}>{result.nama}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

          {/* Barcode */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2mm 0', overflow: 'hidden' }}>
            <Barcode value={result.patient_code} />
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

          {/* Footer */}
          <div style={{ fontSize: '8px', textAlign: 'left', lineHeight: 1.5, color: '#333' }}>
            Tunjukkan struk ini ke dokter saat dipanggil.
          </div>
          <div style={{ fontSize: '8px', color: '#333', marginTop: '1mm' }}>
            {new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3mm', fontSize: '9px', fontStyle: 'italic', letterSpacing: '1px' }}>--- SEHAT SELALU ---</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Pendaftaran Pasien</h1>
          <p className="text-muted-foreground">Isi data Anda. Data sensor IoT akan otomatis terisi.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 md:p-8 bg-gradient-card shadow-card space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap *">
                <Input value={form.nama} onChange={handleChange("nama")} required maxLength={100} placeholder="Budi Santoso" />
              </Field>
              <Field label="Umur">
                <Input type="number" min={0} max={150} value={form.umur} onChange={handleChange("umur")} placeholder="35" />
              </Field>
              <Field label="Jenis Kelamin">
                <Select value={form.jenis_kelamin} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pekerjaan">
                <Input value={form.pekerjaan} onChange={handleChange("pekerjaan")} maxLength={100} placeholder="Karyawan" />
              </Field>
              <Field label="Alamat" full>
                <Textarea value={form.alamat} onChange={handleChange("alamat")} maxLength={300} rows={2} placeholder="Jl. Mawar No. 1" />
              </Field>
              <Field label="Riwayat Penyakit" full>
                <Textarea value={form.riwayat_penyakit} onChange={handleChange("riwayat_penyakit")} maxLength={500} rows={2} placeholder="Hipertensi, dll." />
              </Field>
              <Field label="Alergi" full>
                <Textarea value={form.alergi} onChange={handleChange("alergi")} maxLength={300} rows={2} placeholder="Antibiotik, makanan laut, dll." />
              </Field>
              <Field label="Keluhan Sakit ✱" full>
                <Textarea value={form.keluhan} onChange={handleChange("keluhan")} maxLength={500} rows={3} placeholder="Contoh: demam 3 hari, sakit kepala, batuk berdahak..." className="border-primary/40 focus:border-primary" />
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-accent/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Data Sensor IoT (ESP32)</div>
                    <div className="text-xs text-muted-foreground">Otomatis dari perangkat — bisa diedit jika perlu</div>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={fetchEsp}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Sync
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Tinggi (cm)">
                  <Input type="number" step="0.1" value={form.tinggi_badan} onChange={handleChange("tinggi_badan")} />
                </Field>
                <Field label="Berat (kg)">
                  <Input type="number" step="0.1" value={form.berat_badan} onChange={handleChange("berat_badan")} />
                </Field>
                <Field label="Suhu (°C)">
                  <Input type="number" step="0.1" value={form.suhu_tubuh} onChange={handleChange("suhu_tubuh")} />
                </Field>
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-hero shadow-soft hover:shadow-glow transition-smooth">
              {submitting ? "Menyimpan..." : "Daftar & Buat Barcode"}
            </Button>
          </Card>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}
