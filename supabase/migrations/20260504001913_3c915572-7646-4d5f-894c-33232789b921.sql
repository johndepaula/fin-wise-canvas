-- Remove duplicates: keep the row with highest amount_paid, then earliest created_at
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, account_type, due_date, amount
      ORDER BY amount_paid DESC, created_at ASC
    ) AS rn
  FROM public.bills
)
DELETE FROM public.bills b
USING ranked r
WHERE b.id = r.id AND r.rn > 1;

-- Prevent future duplicates
ALTER TABLE public.bills
  ADD CONSTRAINT bills_unique_per_user UNIQUE (user_id, account_type, due_date, amount);