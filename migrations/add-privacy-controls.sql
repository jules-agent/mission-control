-- Migration: Add privacy and sharing controls to categories
-- Date: 2026-02-15
-- Purpose: Enable category-level privacy toggles and sharing permissions

-- Add is_shareable column to categories (default true)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN DEFAULT true;

-- Add sharing metadata
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS sharing_mode VARCHAR(50) DEFAULT 'unrestricted';
  -- Options: 'unrestricted', 'family', 'private'

-- Add last_shared timestamp for tracking
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS last_shared_at TIMESTAMPTZ;

-- Create index for privacy queries
CREATE INDEX IF NOT EXISTS idx_categories_shareable 
  ON categories(is_shareable) 
  WHERE is_shareable = true;

-- Create shared_contexts table for account linking
CREATE TABLE IF NOT EXISTS shared_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, revoked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(from_profile_id, to_profile_id)
);

-- Create shared_categories table (which categories are shared in a context)
CREATE TABLE IF NOT EXISTS shared_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_context_id UUID NOT NULL REFERENCES shared_contexts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  include_subcategories BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shared_context_id, category_id)
);

-- Create share_links table for external sharing (non-account holders)
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., "auggie-gifts-2026"
  title VARCHAR(200),
  description TEXT,
  format VARCHAR(20) DEFAULT 'web', -- web, pdf, text
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create share_link_categories table (which categories are in the share link)
CREATE TABLE IF NOT EXISTS share_link_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  include_subcategories BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(share_link_id, category_id)
);

-- Create gift_tracking table for Pintrest-style features
CREATE TABLE IF NOT EXISTS gift_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  influence_id UUID REFERENCES influences(id) ON DELETE CASCADE,
  purchaser_name VARCHAR(200),
  purchaser_email VARCHAR(200),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_confirmed BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_contexts_profiles 
  ON shared_contexts(from_profile_id, to_profile_id);

CREATE INDEX IF NOT EXISTS idx_share_links_slug 
  ON share_links(slug) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_share_links_profile 
  ON share_links(profile_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gift_tracking_link 
  ON gift_tracking(share_link_id);

-- Add comments
COMMENT ON COLUMN categories.is_shareable IS 'Whether this category can be shared via share links or account connections';
COMMENT ON COLUMN categories.sharing_mode IS 'unrestricted (anyone), family (family members only), private (no one)';
COMMENT ON TABLE shared_contexts IS 'Account-to-account connections for native identity sharing';
COMMENT ON TABLE share_links IS 'External share links for non-account holders (e.g., grandparents)';
COMMENT ON TABLE gift_tracking IS 'Tracks who bought what gifts to avoid duplicates';

-- Set default privacy for existing categories
-- Work & Business domain: private by default
UPDATE categories 
SET is_shareable = false, sharing_mode = 'private'
WHERE name ILIKE '%business%' 
   OR name ILIKE '%work%' 
   OR name ILIKE '%news%'
   OR type = 'news';

-- All others: shareable by default (already set by column default)
