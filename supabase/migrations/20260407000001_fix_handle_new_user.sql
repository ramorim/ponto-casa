-- Fix: qualify table reference and explicitly set search_path
-- The trigger runs in auth schema context where 'profiles' isn't visible
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
