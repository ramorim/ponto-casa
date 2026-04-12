-- Adiciona coluna de cidade ao perfil do usuário para seleção de feriados regionais
ALTER TABLE profiles ADD COLUMN city TEXT;

COMMENT ON COLUMN profiles.city IS 'Cidade do usuário no formato "NomeDaCidade-UF" para feriados regionais';
