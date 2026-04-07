-- Seed: empregador + funcionário de teste
-- IMPORTANTE: usuários só podem ser criados via auth.users (não diretamente em profiles)
-- Use este seed apenas se quiser criar perfis manualmente após signup

-- Para teste local com OTP:
-- 1. Faça signup via tela de login com seu telefone/email
-- 2. Complete o onboarding escolhendo o role
-- 3. Para testar os dois lados (empregador e funcionário), faça signup com 2 contas

-- Exemplo de inserção manual após criar usuários:
-- INSERT INTO work_schedules (employee_id, start_time, lunch_start, lunch_end, end_time, valid_from)
-- VALUES (
--   '<UUID-do-funcionário>',
--   '08:00', '12:00', '13:00', '17:00', CURRENT_DATE
-- );
