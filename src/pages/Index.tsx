import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, ScanLine, LayoutDashboard, HeartPulse, Cpu, ShieldCheck } from "lucide-react";

const features = [
  { icon: UserPlus, title: "Pendaftaran Mandiri", desc: "Pasien isi data sendiri lewat kiosk dengan UI ramah." },
  { icon: Cpu, title: "Integrasi IoT (ESP32)", desc: "Tinggi, berat & suhu otomatis dari sensor." },
  { icon: ScanLine, title: "Barcode Pasien", desc: "Code128 unik — dokter cukup scan, data muncul." },
  { icon: HeartPulse, title: "Antrian Otomatis", desc: "Nomor antrian instan setelah submit." },
  { icon: LayoutDashboard, title: "Dashboard Realtime", desc: "Pantau status: menunggu, dipanggil, selesai." },
  { icon: ShieldCheck, title: "Aman & Cepat", desc: "Data tersimpan di cloud, hanya ID di barcode." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main>
        {/* Hero */}
        <section className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <HeartPulse className="h-4 w-4" /> Self Healty Care
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Pendaftaran pasien <span className="text-gradient-hero">tanpa antri panjang</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pasien daftar mandiri, sensor IoT ukur otomatis, dokter cukup scan barcode — semua data muncul instan.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-gradient-hero shadow-soft hover:shadow-glow transition-smooth">
                <Link to="/daftar">Mulai Pendaftaran</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dokter">Halaman Dokter</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="p-6 bg-gradient-card border-border shadow-card hover:shadow-glow transition-smooth">
                  <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
