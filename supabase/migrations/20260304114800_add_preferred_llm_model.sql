-- Add preferred LLM model preference
ALTER TABLE profiles 
ADD COLUMN preferred_llm_model TEXT NOT NULL DEFAULT 'claude-3-5-haiku-20241022';
