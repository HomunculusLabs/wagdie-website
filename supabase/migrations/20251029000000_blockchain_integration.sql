-- Migration: Blockchain Integration
-- Description: Add tables for tracking blockchain transactions and user blockchain state
-- Created: 2025-10-29

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pending_transactions table for tracking user transactions
CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('idle', 'pending', 'confirming', 'success', 'error')),
  error_message TEXT,
  confirmations INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_address ON public.pending_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_transaction_hash ON public.pending_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_status ON public.pending_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_created_at ON public.pending_transactions(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_pending_transactions_updated_at
  BEFORE UPDATE ON public.pending_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.pending_transactions
  FOR SELECT
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.pending_transactions
  FOR INSERT
  WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON public.pending_transactions
  FOR UPDATE
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON public.pending_transactions
  FOR DELETE
  USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Grant necessary permissions
GRANT ALL ON public.pending_transactions TO authenticated;
GRANT SELECT ON public.pending_transactions TO anon;

-- Add comment for documentation
COMMENT ON TABLE public.pending_transactions IS 'Tracks pending blockchain transactions for users';
COMMENT ON COLUMN public.pending_transactions.user_address IS 'Ethereum address of the user (lowercase checksummed)';
COMMENT ON COLUMN public.pending_transactions.transaction_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN public.pending_transactions.operation_type IS 'Type of operation (e.g., sear_concords, stake_wagdies)';
COMMENT ON COLUMN public.pending_transactions.status IS 'Current status of the transaction';
COMMENT ON COLUMN public.pending_transactions.metadata IS 'Additional operation-specific data stored as JSON';
