-- Add CPF and email fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional unique index on CPF (when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_unique
  ON profiles (cpf)
  WHERE cpf IS NOT NULL;

-- Update handle_new_user trigger to populate email from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
