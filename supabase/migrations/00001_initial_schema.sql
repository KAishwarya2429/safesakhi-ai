
-- Enums
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.travel_mode AS ENUM ('walking', 'driving', 'public_transport', 'cycling');
CREATE TYPE public.mission_status AS ENUM ('active', 'completed', 'emergency', 'cancelled');
CREATE TYPE public.escalation_tier AS ENUM ('none', 'tier1', 'tier2', 'tier3');
CREATE TYPE public.agent_name AS ENUM ('risk_intelligence', 'route_guardian', 'trusted_contact', 'evidence', 'emergency_coordinator');
CREATE TYPE public.agent_status AS ENUM ('idle', 'active', 'alert', 'emergency');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.checkin_status AS ENUM ('pending', 'responded', 'missed', 'escalated');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'user',
  avatar_url text,
  check_in_interval integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trusted contacts
CREATE TABLE public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  relationship text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safety missions
CREATE TABLE public.safety_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_code text UNIQUE NOT NULL,
  origin_address text,
  destination_address text NOT NULL,
  travel_mode public.travel_mode NOT NULL DEFAULT 'walking',
  expected_duration_minutes integer NOT NULL DEFAULT 30,
  check_in_interval_minutes integer NOT NULL DEFAULT 10,
  status public.mission_status NOT NULL DEFAULT 'active',
  escalation_tier public.escalation_tier NOT NULL DEFAULT 'none',
  risk_score integer NOT NULL DEFAULT 0,
  start_lat double precision,
  start_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  current_lat double precision,
  current_lng double precision,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Check-ins
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.safety_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.checkin_status NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  location_lat double precision,
  location_lng double precision,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agent logs
CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.safety_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent public.agent_name NOT NULL,
  status public.agent_status NOT NULL DEFAULT 'idle',
  action text NOT NULL,
  reasoning text,
  tool_called text,
  tool_params jsonb,
  tool_result jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Risk assessments
CREATE TABLE public.risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.safety_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_lat double precision,
  location_lng double precision,
  location_name text,
  risk_score integer NOT NULL DEFAULT 0,
  time_of_day_multiplier numeric(3,2) NOT NULL DEFAULT 1.0,
  weather_impact integer NOT NULL DEFAULT 0,
  historical_incidents integer NOT NULL DEFAULT 0,
  factors jsonb,
  analysis text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Incidents
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.safety_missions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  location_lat double precision,
  location_lng double precision,
  location_address text,
  evidence_urls text[],
  escalation_reached public.escalation_tier NOT NULL DEFAULT 'none',
  report_generated boolean NOT NULL DEFAULT false,
  report_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- MCP tool calls log
CREATE TABLE public.mcp_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.safety_missions(id) ON DELETE CASCADE,
  agent public.agent_name NOT NULL,
  tool_name text NOT NULL,
  parameters jsonb,
  result jsonb,
  execution_time_ms integer,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mission code generator
CREATE OR REPLACE FUNCTION generate_mission_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'MSN-';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger for mission code
CREATE OR REPLACE FUNCTION set_mission_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.mission_code IS NULL OR NEW.mission_code = '' THEN
    NEW.mission_code := generate_mission_code();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER before_insert_safety_missions
  BEFORE INSERT ON public.safety_missions
  FOR EACH ROW EXECUTE FUNCTION set_mission_code();

-- Handle new user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (NEW.id, NEW.email, NEW.phone, 'user'::public.user_role);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_tool_calls ENABLE ROW LEVEL SECURITY;

-- Helper function for role
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- Profiles policies
CREATE POLICY "Admins full access profiles" ON profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Users view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- Trusted contacts policies
CREATE POLICY "Users manage own trusted contacts" ON trusted_contacts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Safety missions policies
CREATE POLICY "Users manage own missions" ON safety_missions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Check-ins policies
CREATE POLICY "Users manage own check-ins" ON check_ins FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Agent logs policies
CREATE POLICY "Users view own agent logs" ON agent_logs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Risk assessments policies
CREATE POLICY "Users manage own risk assessments" ON risk_assessments FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Incidents policies
CREATE POLICY "Users manage own incidents" ON incidents FOR ALL TO authenticated USING (auth.uid() = user_id);

-- MCP tool calls policies
CREATE POLICY "Users view own mcp calls" ON mcp_tool_calls FOR ALL TO authenticated USING (
  mission_id IN (SELECT id FROM safety_missions WHERE user_id = auth.uid())
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcp_tool_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_assessments;

-- Public profiles view
CREATE VIEW public_profiles AS SELECT id, role FROM profiles;
