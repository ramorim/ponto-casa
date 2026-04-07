-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT CHECK (role IN ('employer', 'employee')),
  employer_id UUID REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_employer_id ON profiles(employer_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Trigger: auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- USER DEVICES
-- ============================================================
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Dispositivo',
  device_type TEXT NOT NULL DEFAULT 'desktop',
  browser TEXT NOT NULL DEFAULT '',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);

-- ============================================================
-- EMPLOYER INVITES
-- ============================================================
CREATE TABLE employer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_phone TEXT,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_employer_invites_token ON employer_invites(token);
CREATE INDEX idx_employer_invites_employer_id ON employer_invites(employer_id);

-- ============================================================
-- CONNECTION REQUESTS
-- ============================================================
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_connection_requests_employer_id ON connection_requests(employer_id);
CREATE INDEX idx_connection_requests_employee_id ON connection_requests(employee_id);

CREATE TRIGGER connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- WORK SCHEDULES
-- ============================================================
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIME NOT NULL DEFAULT '08:00',
  lunch_start TIME NOT NULL DEFAULT '12:00',
  lunch_end TIME NOT NULL DEFAULT '13:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_schedules_employee_id ON work_schedules(employee_id);

-- ============================================================
-- TIME ENTRIES
-- ============================================================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('entrada', 'saida_almoco', 'volta_almoco', 'saida')),
  timestamp_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DECIMAL,
  longitude DECIMAL,
  device_info TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_employee_day ON time_entries(employee_id, timestamp_server);

-- ============================================================
-- TIME ENTRY AUDIT
-- ============================================================
CREATE TABLE time_entry_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entry_audit_entry_id ON time_entry_audit(entry_id);

-- Trigger: auto-audit on time_entries update
CREATE OR REPLACE FUNCTION audit_time_entry_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.timestamp_server IS DISTINCT FROM NEW.timestamp_server THEN
    INSERT INTO time_entry_audit (entry_id, field_changed, previous_value, new_value, changed_by, reason)
    VALUES (
      OLD.id,
      'timestamp_server',
      OLD.timestamp_server::TEXT,
      NEW.timestamp_server::TEXT,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      COALESCE(current_setting('app.audit_reason', true), 'Alteração manual')
    );
  END IF;

  IF OLD.note IS DISTINCT FROM NEW.note THEN
    INSERT INTO time_entry_audit (entry_id, field_changed, previous_value, new_value, changed_by, reason)
    VALUES (
      OLD.id,
      'note',
      OLD.note,
      NEW.note,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      COALESCE(current_setting('app.audit_reason', true), 'Alteração manual')
    );
  END IF;

  IF OLD.event_type IS DISTINCT FROM NEW.event_type THEN
    INSERT INTO time_entry_audit (entry_id, field_changed, previous_value, new_value, changed_by, reason)
    VALUES (
      OLD.id,
      'event_type',
      OLD.event_type,
      NEW.event_type,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      COALESCE(current_setting('app.audit_reason', true), 'Alteração manual')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER time_entries_audit_trigger
  AFTER UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION audit_time_entry_changes();

-- ============================================================
-- MONTHLY CLOSINGS
-- ============================================================
CREATE TABLE monthly_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_ref TEXT NOT NULL,  -- 'YYYY-MM'
  total_hours DECIMAL,
  overtime_hours DECIMAL,
  delay_minutes DECIMAL,
  absence_days INTEGER,
  notes TEXT,
  employee_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, month_ref)
);

CREATE INDEX idx_monthly_closings_employee_id ON monthly_closings(employee_id);

-- ============================================================
-- OTP CODES
-- ============================================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_or_email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_phone_or_email ON otp_codes(phone_or_email, created_at DESC);
