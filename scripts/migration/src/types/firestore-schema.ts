/**
 * Firestore Document Type Definitions
 *
 * These types represent the structure of documents in the legacy Firestore database.
 * Source: specs/001-migration-plan/data-model.md
 */

import type { Timestamp } from 'firebase-admin/firestore';

/**
 * User document from Firestore `/users/{ethAddress}` collection
 */
export interface FirestoreUser {
  ethAddress: string; // Document ID, Ethereum wallet address
  createdAt: Timestamp; // Account creation timestamp
  lastLoginAt: Timestamp; // Last authentication timestamp
  loginCount: number; // Total number of logins
  preferences?: Record<string, unknown>; // User preferences (not migrated to PostgreSQL)
}

/**
 * Character document from Firestore `/characters/{tokenId}` collection
 */
export interface FirestoreCharacter {
  tokenId: number; // Document ID, NFT token ID
  contractAddress: string; // NFT contract address
  ownerAddress: string; // Current owner wallet address
  metadataUrl?: string; // IPFS URL for metadata
  imageUrl?: string; // Direct image URL
  name?: string; // Character name from metadata
  burned: boolean; // Whether NFT is burned
  infected: boolean; // Game state: infected status
  locationId?: string; // Current location (if staked)
  mintedAt: Timestamp; // Minting timestamp
  metadata?: {
    name?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    [key: string]: unknown;
  }; // Full metadata object
}

/**
 * Tweet document from Firestore `/tweets/{tweetId}` collection
 */
export interface FirestoreTweet {
  id: string; // Document ID, Twitter/X tweet ID
  authorId: string; // Twitter/X user ID
  content: string; // Tweet text content
  mediaUrls?: string[]; // Attached image/video URLs
  createdAt: Timestamp; // Tweet creation timestamp
}

/**
 * Location document from Firestore `/locations/{locationId}` collection
 */
export interface FirestoreLocation {
  id: string; // Document ID, location identifier
  name: string; // Display name
  description?: string; // Flavor text
  capacity?: number; // Max characters allowed
  metadata?: Record<string, unknown>; // Additional data
}

/**
 * Union type for all Firestore documents
 */
export type FirestoreDocument =
  | FirestoreUser
  | FirestoreCharacter
  | FirestoreTweet
  | FirestoreLocation;

/**
 * Collection names in Firestore
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  TWEETS: 'tweets',
  LOCATIONS: 'locations',
} as const;

export type FirestoreCollectionName = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];
