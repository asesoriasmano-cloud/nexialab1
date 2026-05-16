-- Increment function for atomic counter updates
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
  SELECT $1 + 1
$$ LANGUAGE SQL IMMUTABLE;

-- Function to get available slots (used by availability API)
CREATE OR REPLACE FUNCTION get_business_stats(p_business_id UUID, p_month_start TIMESTAMPTZ, p_month_end TIMESTAMPTZ)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'no_shows', COUNT(*) FILTER (WHERE status = 'no_show'),
    'revenue', COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0)
  ) INTO result
  FROM appointments
  WHERE business_id = p_business_id
    AND start_time >= p_month_start
    AND start_time <= p_month_end;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update client stats after appointment completion
CREATE OR REPLACE FUNCTION update_client_stats_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE clients SET
      visit_count = visit_count + 1,
      total_spent = total_spent + COALESCE(NEW.price, 0),
      last_visit_at = NEW.start_time,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    UPDATE clients SET
      no_show_count = no_show_count + 1,
      updated_at = NOW()
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_client_stats_on_appointment();
