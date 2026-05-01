import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, ScanLine, X, User, MapPin, Briefcase, Calendar, HeartPulse, AlertTriangle, Ruler, Weight, Thermometer } from "lucide-react";

interface Patient {
  patient_code: string; queue_number: number; nama: string; alamat: string|null; pekerjaan: string|null;
  umur: number|null; jenis_kelamin: string|null; keluhan: string|null; riwayat_penyakit: string|null; alergi: string|null;
  tinggi_badan: number|null; berat_badan: number|null; suhu_tubuh: number|null; status: string;
}

export default function Dokter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [manualCode, setManualCode] = useState("");

  const stopScan = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  const startScan = async () => {
    setScanning(true);
    try {
      readerRef.current ||= new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined, videoRef.current!, (result) => {
          if (result) {
            const code = result.getText();
            stopScan();
            lookup(code);
          }
        }
      );
      controlsRef.current = controls as any;
    } catch (e: any) {
      toast.error("Tidak bisa mengakses kamera");
      setScanning(false);
    }
  };

  useEffect(() => () => stopScan(), []);

  const lookup = async (code: string) => {
    const { data, error } = await supabase.from("patients").select("*").eq("patient_code", code.trim()).maybeSingle();
    if (error || !data) { toast.error("Pasien tidak ditemukan: " + code); return; }
    setPatient(data as Patient);
    toast.success(`Data ${data.nama} dimuat`);
  };

  const updateStatus = async (status: string) => {
    if (!patient) return;
    const { error } = await supabase.from("patients").update({ status }).eq("patient_code", patient.patient_code);
    if (error) { toast.error("Gagal update status"); return; }
    setPatient({ ...patient, status });
    toast.success(`Status: ${status}`);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container py-10 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><ScanLine className="h-7 w-7 text-primary" />Halaman Dokter</h1>
          <p className="text-muted-foreground">Scan barcode pasien untuk melihat data lengkap.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-card shadow-card">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Scanner Kamera</h2>
            <div className="aspect-video rounded-xl bg-muted overflow-hidden flex items-center justify-center mb-3 border border-border">
              {scanning ? (
                <video ref={videoRef} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <Camera className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Klik mulai untuk mengaktifkan kamera</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {scanning ? (
                <Button onClick={stopScan} variant="destructive" className="flex-1"><X className="h-4 w-4 mr-1" />Stop</Button>
              ) : (
                <Button onClick={startScan} className="flex-1 bg-gradient-hero"><Camera className="h-4 w-4 mr-1" />Mulai Scan</Button>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <label className="text-xs text-muted-foreground">Atau input manual</label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="PASIEN-000001" value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
                <Button variant="outline" onClick={() => manualCode && lookup(manualCode)}>Cari</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card shadow-card">
            {patient ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">{patient.patient_code}</div>
                    <h3 className="text-2xl font-bold">{patient.nama}</h3>
                  </div>
                  <Badge variant="secondary" className="text-base px-3 py-1">#{patient.queue_number}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info icon={Calendar} label="Umur" value={patient.umur ? `${patient.umur} thn` : "-"} />
                  <Info icon={User} label="Jenis Kelamin" value={patient.jenis_kelamin ?? "-"} />
                  <Info icon={Briefcase} label="Pekerjaan" value={patient.pekerjaan ?? "-"} />
                  <Info icon={MapPin} label="Alamat" value={patient.alamat ?? "-"} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Vital icon={Ruler} label="Tinggi" value={patient.tinggi_badan} unit="cm" />
                  <Vital icon={Weight} label="Berat" value={patient.berat_badan} unit="kg" />
                  <Vital icon={Thermometer} label="Suhu" value={patient.suhu_tubuh} unit="°C" />
                </div>

                <div className="space-y-2">
                  {patient.keluhan && (
                    <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">✱ Keluhan Sakit</div>
                      <div className="text-sm font-medium">{patient.keluhan}</div>
                    </div>
                  )}
                  <Detail icon={HeartPulse} label="Riwayat Penyakit" value={patient.riwayat_penyakit} />
                  <Detail icon={AlertTriangle} label="Alergi" value={patient.alergi} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus("dipanggil")}>Panggil</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus("selesai")}>Selesai</Button>
                  <Badge className="ml-auto self-center capitalize">{patient.status}</Badge>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <ScanLine className="h-12 w-12 mb-3 opacity-40" />
                <p>Belum ada pasien dipindai</p>
                <p className="text-xs mt-1">Hasil scan akan tampil di sini</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="p-3 rounded-lg bg-secondary/60">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5"><Icon className="h-3 w-3" />{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function Vital({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="p-3 rounded-lg bg-accent text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold text-lg">{value ?? "-"}<span className="text-xs font-normal text-muted-foreground ml-0.5">{value ? unit : ""}</span></div>
    </div>
  );
}
function Detail({ icon: Icon, label, value }: any) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Icon className="h-3 w-3" />{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground italic">Tidak ada</span>}</div>
    </div>
  );
}
