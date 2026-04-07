-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Employers can read their employees profiles"
  ON profiles FOR SELECT
  USING (employer_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- USER DEVICES
-- ============================================================
CREATE POLICY "Users manage own devices"
  ON user_devices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- EMPLOYER INVITES
-- ============================================================
CREATE POLICY "Employers manage own invites"
  ON employer_invites FOR ALL
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Anyone can read invite by token"
  ON employer_invites FOR SELECT
  USING (TRUE);

-- ============================================================
-- CONNECTION REQUESTS
-- ============================================================
CREATE POLICY "Employees can create connection requests"
  ON connection_requests FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can read own requests"
  ON connection_requests FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employers can read requests directed to them"
  ON connection_requests FOR SELECT
  USING (employer_id = auth.uid());

CREATE POLICY "Employers can update request status"
  ON connection_requests FOR UPDATE
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- ============================================================
-- WORK SCHEDULES
-- ============================================================
CREATE POLICY "Employers manage schedules of their employees"
  ON work_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = work_schedules.employee_id
      AND profiles.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employees can read own schedule"
  ON work_schedules FOR SELECT
  USING (employee_id = auth.uid());

-- ============================================================
-- TIME ENTRIES
-- ============================================================
CREATE POLICY "Employees can insert own entries"
  ON time_entries FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can read own entries"
  ON time_entries FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employers can read their employees entries"
  ON time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = time_entries.employee_id
      AND profiles.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update their employees entries"
  ON time_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = time_entries.employee_id
      AND profiles.employer_id = auth.uid()
    )
  );

-- ============================================================
-- TIME ENTRY AUDIT
-- ============================================================
CREATE POLICY "Users can read audit for visible entries"
  ON time_entry_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = time_entry_audit.entry_id
      AND (
        time_entries.employee_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = time_entries.employee_id
          AND profiles.employer_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- MONTHLY CLOSINGS
-- ============================================================
CREATE POLICY "Employers can manage closings of their employees"
  ON monthly_closings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = monthly_closings.employee_id
      AND profiles.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employees can read own closings"
  ON monthly_closings FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Employees can accept own closings"
  ON monthly_closings FOR UPDATE
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- ============================================================
-- OTP CODES — server-only access via service role
-- ============================================================
-- No RLS policies needed; OTP table is accessed only via service role key
-- from API routes. RLS is enabled but no policies = no client access.
