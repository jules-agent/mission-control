/**
 * IdentityKit - TypeScript/React Native Client for Master Identity System
 * Provides type-safe access to the Identity API from React Native apps
 */

const DEFAULT_API_BASE = 'https://jules3000.com/api/identity';

// ============================================================================
// TYPES
// ============================================================================

export interface Identity {
  id: string;
  userId: string;
  name: string;
  isBase: boolean;
  parentId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  identityId: string;
  parentId?: string;
  name: string;
  type: string;
  level: number;
}

export interface Influence {
  id: string;
  categoryId: string;
  name: string;
  alignment: number;
  position: number;
  moodTags?: string[];
  metadata?: Record<string, any>;
  matchScore?: number;
}

export interface MatchContext {
  mood?: string;
  timeOfDay?: string;
  songType?: string;
  categoryTypes?: string[];
  [key: string]: any;
}

export interface MatchRequest {
  identityId: string;
  context: MatchContext;
  limit?: number;
  minAlignment?: number;
}

export interface MatchResponse {
  matches: Influence[];
  contextApplied: MatchContext;
  totalMatches: number;
}

export interface PlayHistoryEntry {
  identityId: string;
  tool: string;
  influenceId: string;
  context?: MatchContext;
}

// ============================================================================
// CLIENT
// ============================================================================

export class IdentityClient {
  private apiBase: string;
  private userId?: string;

  constructor(apiBase?: string, userId?: string) {
    this.apiBase = apiBase || DEFAULT_API_BASE;
    this.userId = userId;
  }

  // ------------------------------------------------------------------------
  // IDENTITIES
  // ------------------------------------------------------------------------

  async getIdentities(): Promise<Identity[]> {
    if (!this.userId) {
      throw new Error('User ID required - call setUserId() first');
    }

    const response = await fetch(`${this.apiBase}?userId=${this.userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch identities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.identities || [];
  }

  async getIdentity(identityId: string): Promise<Identity> {
    const response = await fetch(`${this.apiBase}/${identityId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch identity: ${response.statusText}`);
    }

    const data = await response.json();
    return data.identity;
  }

  async createIdentity(name: string, isBase = false, parentId?: string): Promise<Identity> {
    if (!this.userId) {
      throw new Error('User ID required - call setUserId() first');
    }

    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.userId,
        name,
        isBase,
        parentId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create identity: ${response.statusText}`);
    }

    const data = await response.json();
    return data.identity;
  }

  // ------------------------------------------------------------------------
  // MATCHING
  // ------------------------------------------------------------------------

  async match(request: MatchRequest): Promise<MatchResponse> {
    const response = await fetch(`${this.apiBase}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to match: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Match influences for current time of day
   */
  async matchForNow(identityId: string, context: Partial<MatchContext> = {}): Promise<MatchResponse> {
    const hour = new Date().getHours();
    let timeOfDay: string;

    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    return this.match({
      identityId,
      context: {
        timeOfDay,
        ...context
      }
    });
  }

  // ------------------------------------------------------------------------
  // PLAY HISTORY
  // ------------------------------------------------------------------------

  async recordPlay(entry: PlayHistoryEntry): Promise<void> {
    const response = await fetch(`${this.apiBase}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });

    if (!response.ok) {
      throw new Error(`Failed to record play: ${response.statusText}`);
    }
  }

  // ------------------------------------------------------------------------
  // USER MANAGEMENT
  // ------------------------------------------------------------------------

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }
}

// ============================================================================
// REACT HOOKS (optional)
// ============================================================================

import { useState, useEffect } from 'react';

export function useIdentities(client: IdentityClient) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    client.getIdentities()
      .then(setIdentities)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [client]);

  return { identities, loading, error };
}

export function useMatch(client: IdentityClient, identityId: string, context: MatchContext) {
  const [matches, setMatches] = useState<Influence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    client.match({ identityId, context })
      .then(response => setMatches(response.matches))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [client, identityId, JSON.stringify(context)]);

  return { matches, loading, error };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default IdentityClient;
