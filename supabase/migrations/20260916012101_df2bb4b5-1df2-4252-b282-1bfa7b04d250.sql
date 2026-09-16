ALTER TABLE public.app_settings
  ADD COLUMN tasting_address text NOT NULL DEFAULT '',
  ADD COLUMN tasting_number text NOT NULL DEFAULT '',
  ADD COLUMN tasting_complement text NOT NULL DEFAULT '',
  ADD COLUMN tasting_neighborhood text NOT NULL DEFAULT '',
  ADD COLUMN tasting_city text NOT NULL DEFAULT '',
  ADD COLUMN tasting_state text NOT NULL DEFAULT 'SP',
  ADD COLUMN tasting_cep text NOT NULL DEFAULT '';

ALTER TABLE public.quotes
  ADD COLUMN archived_at timestamptz;

ALTER TABLE public.tasting_appointments
  ADD COLUMN duration_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN hold_expires_at timestamptz,
  ADD COLUMN public_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex');

ALTER TABLE public.tasting_appointments
  ADD CONSTRAINT tasting_appointments_duration_one_hour CHECK (duration_minutes = 60),
  ADD CONSTRAINT tasting_appointments_public_token_key UNIQUE (public_token);

ALTER TABLE public.tasting_appointments
  DROP CONSTRAINT tasting_appointments_status_check,
  DROP CONSTRAINT tasting_appointments_payment_status_check;

UPDATE public.tasting_appointments
SET status = CASE
  WHEN status = 'scheduled' AND payment_status = 'pending' THEN 'pending_payment'
  ELSE status
END;

ALTER TABLE public.tasting_appointments
  ADD CONSTRAINT tasting_appointments_status_check
    CHECK (status IN ('pending_payment', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  ADD CONSTRAINT tasting_appointments_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'refunded'));

DROP INDEX public.tasting_appointments_slot_key;
CREATE UNIQUE INDEX tasting_appointments_slot_key
  ON public.tasting_appointments (date, time)
  WHERE status IN ('pending_payment', 'scheduled', 'confirmed');

UPDATE public.tasting_availability SET interval_minutes = 60 WHERE interval_minutes <> 60;
ALTER TABLE public.tasting_availability
  ALTER COLUMN interval_minutes SET DEFAULT 60,
  ADD CONSTRAINT tasting_availability_one_hour CHECK (interval_minutes = 60);

UPDATE public.app_settings SET tasting_interval_minutes = 60 WHERE tasting_interval_minutes <> 60;
ALTER TABLE public.app_settings
  ALTER COLUMN tasting_interval_minutes SET DEFAULT 60,
  ADD CONSTRAINT app_settings_tasting_one_hour CHECK (tasting_interval_minutes = 60);

CREATE INDEX quotes_archived_at_idx ON public.quotes (archived_at);
CREATE INDEX tasting_appointments_hold_expires_idx
  ON public.tasting_appointments (hold_expires_at)
  WHERE status = 'pending_payment';