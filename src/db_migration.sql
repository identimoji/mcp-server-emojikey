-- Count emojikeys by type
CREATE OR REPLACE FUNCTION count_emojikeys_by_type(
  input_user_id UUID,
  input_model TEXT,
  input_emojikey_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM emojikeys
  WHERE user_id = input_user_id
    AND model = input_model
    AND emojikey_type = input_emojikey_type;
  
  RETURN count_result;
END;
$$;

-- Count emojikeys since a specific timestamp
CREATE OR REPLACE FUNCTION count_emojikeys_since_timestamp(
  input_user_id UUID,
  input_model TEXT,
  input_timestamp TIMESTAMPTZ,
  input_emojikey_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM emojikeys
  WHERE user_id = input_user_id
    AND model = input_model
    AND emojikey_type = input_emojikey_type
    AND created_at > input_timestamp;
  
  RETURN count_result;
END;
$$;