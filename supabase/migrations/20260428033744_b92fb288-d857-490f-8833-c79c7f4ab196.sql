
-- Patients table for self health care system. No auth required (kiosk-style + doctor scanner).
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code text NOT NULL UNIQUE,
  queue_number int NOT NULL,
  nama text NOT NULL,
  alamat text,
  pekerjaan text,
  umur int,
  jenis_kelamin text,
  riwayat_penyakit text,
  alergi text,
  tinggi_badan numeric,
  berat_badan numeric,
  suhu_tubuh numeric,
  status text NOT NULL DEFAULT 'menunggu',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sequence for queue numbers (resets logically per day in app, but unique global ok)
CREATE SEQUENCE IF NOT EXISTS public.patient_queue_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.patient_code_seq START 1;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Public access (kiosk + doctor station). Anyone can read/insert/update.
CREATE POLICY "public read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "public insert patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "public update patients" ON public.patients FOR UPDATE USING (true);

-- Latest sensor reading from ESP (buffer until a patient form submitted)
CREATE TABLE public.esp_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tinggi_badan numeric,
  berat_badan numeric,
  suhu_tubuh numeric,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.esp_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read esp" ON public.esp_readings FOR SELECT USING (true);
CREATE POLICY "public insert esp" ON public.esp_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update esp" ON public.esp_readings FOR UPDATE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.esp_readings;
