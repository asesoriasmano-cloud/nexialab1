-- =============================================
-- CITAPRO SEED DATA
-- Run this in Supabase SQL editor AFTER creating your first user
-- Replace 'REPLACE_WITH_YOUR_USER_UUID' with your actual user UUID
-- =============================================

DO $$
DECLARE
  v_user_id UUID := 'REPLACE_WITH_YOUR_USER_UUID';
  v_business1_id UUID;
  v_staff1_id UUID;
  v_staff2_id UUID;
  v_service1_id UUID;
  v_service2_id UUID;
  v_service3_id UUID;
  v_service4_id UUID;
  v_client1_id UUID;
  v_client2_id UUID;
BEGIN

-- =============================================
-- BUSINESS 1: Salón de Belleza
-- =============================================
INSERT INTO businesses (
  owner_id, name, slug, description, category,
  phone, email, address, city,
  primary_color, secondary_color,
  min_advance_hours, cancellation_hours,
  deposit_required, deposit_percentage, plan
) VALUES (
  v_user_id, 'Salón Bella Donna', 'bella-donna',
  'Salón de belleza premium. Especialistas en cortes, coloración y tratamientos.',
  'salon', '+56 9 8765 4321', 'hola@belladonna.cl',
  'Av. Providencia 1234', 'Santiago',
  '#8B5CF6', '#EC4899', 1, 24, true, 30, 'professional'
) RETURNING id INTO v_business1_id;

INSERT INTO staff (business_id, name, email, bio, color, role, is_active)
VALUES (v_business1_id, 'Valentina Rosas', 'vale@belladonna.cl',
  'Estilista senior con 8 años de experiencia.', '#8B5CF6', 'staff', true)
RETURNING id INTO v_staff1_id;

INSERT INTO staff (business_id, name, email, bio, color, role, is_active)
VALUES (v_business1_id, 'Camila Torres', 'cami@belladonna.cl',
  'Especialista en tratamientos capilares.', '#EC4899', 'staff', true)
RETURNING id INTO v_staff2_id;

INSERT INTO services (business_id, name, description, category, duration_minutes, buffer_minutes, price, color, is_active)
VALUES (v_business1_id, 'Corte y secado', 'Corte personalizado + lavado y secado.', 'Cabello', 60, 10, 25000, '#8B5CF6', true)
RETURNING id INTO v_service1_id;

INSERT INTO services (business_id, name, description, category, duration_minutes, buffer_minutes, price, color, is_active, requires_intake, intake_questions)
VALUES (v_business1_id, 'Coloración completa', 'Tintura con productos premium.', 'Color', 120, 15, 65000, '#EC4899', true, true,
  '[{"id":"1","question":"¿Has teñido antes? ¿De qué color?","type":"text","required":true},{"id":"2","question":"¿Alergias a tintes?","type":"boolean","required":true}]')
RETURNING id INTO v_service2_id;

INSERT INTO services (business_id, name, description, category, duration_minutes, buffer_minutes, price, color, is_active)
VALUES (v_business1_id, 'Mechas babylights', 'Mechas ultra finas efecto natural.', 'Color', 180, 20, 85000, '#F59E0B', true)
RETURNING id INTO v_service3_id;

INSERT INTO services (business_id, name, description, category, duration_minutes, buffer_minutes, price, color, is_active)
VALUES (v_business1_id, 'Tratamiento keratina', 'Alisado progresivo. Dura 4 meses.', 'Tratamientos', 150, 15, 75000, '#10B981', true)
RETURNING id INTO v_service4_id;

INSERT INTO staff_services (staff_id, service_id) VALUES (v_staff1_id, v_service1_id), (v_staff1_id, v_service2_id), (v_staff1_id, v_service3_id);
INSERT INTO staff_services (staff_id, service_id) VALUES (v_staff2_id, v_service1_id), (v_staff2_id, v_service4_id);

INSERT INTO working_hours (business_id, day_of_week, start_time, end_time, is_active) VALUES
  (v_business1_id, 1, '09:00', '18:00', true),
  (v_business1_id, 2, '09:00', '18:00', true),
  (v_business1_id, 3, '09:00', '18:00', true),
  (v_business1_id, 4, '09:00', '18:00', true),
  (v_business1_id, 5, '09:00', '18:00', true),
  (v_business1_id, 6, '09:00', '14:00', true);

INSERT INTO clients (business_id, name, email, phone, tags, visit_count, total_spent, notes, is_active)
VALUES (v_business1_id, 'María González', 'maria@gmail.com', '+56 9 1111 2222', ARRAY['VIP', 'recurrente'], 8, 320000, 'Alérgica al ammonia.', true)
RETURNING id INTO v_client1_id;

INSERT INTO clients (business_id, name, email, phone, tags, visit_count, total_spent, is_active)
VALUES (v_business1_id, 'Sofía Martínez', 'sofia@hotmail.com', '+56 9 3333 4444', ARRAY['nueva'], 1, 65000, true)
RETURNING id INTO v_client2_id;

INSERT INTO appointments (business_id, client_id, staff_id, service_id, start_time, end_time, status, price, source) VALUES
  (v_business1_id, v_client1_id, v_staff1_id, v_service1_id, NOW() + INTERVAL '2 days 10 hours', NOW() + INTERVAL '2 days 11 hours 10 minutes', 'confirmed', 25000, 'online'),
  (v_business1_id, v_client2_id, v_staff2_id, v_service2_id, NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 16 hours 15 minutes', 'pending', 65000, 'online'),
  (v_business1_id, v_client1_id, v_staff1_id, v_service3_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', 'completed', 85000, 'online'),
  (v_business1_id, v_client1_id, v_staff1_id, v_service1_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour 10 minutes', 'completed', 25000, 'phone');

INSERT INTO packages (business_id, name, description, service_id, sessions_count, price, valid_days, is_active) VALUES
  (v_business1_id, 'Pack 5 cortes', 'Ahorra 20% comprando 5 cortes', v_service1_id, 5, 100000, 180, true),
  (v_business1_id, 'Membresía VIP', '12 cortes + 2 tratamientos de regalo', v_service1_id, 14, 280000, 365, true);

RAISE NOTICE 'Seed completado. Business ID: %', v_business1_id;
RAISE NOTICE 'Visita tu página de reservas en: /book/bella-donna';
END $$;
