import type { ElizaClientConfig, AuthTokens, NonceResponse, VerifyCredentialsResponse } from '../types/index.js';
import { HttpClient } from './http.js';
import { AuthManager } from './auth.js';
import { ChatAPI } from '../chat/index.js';
import { CharactersAPI } from '../characters/index.js';
import { ConversationsAPI } from '../conversations/index.js';
import { NftAPI } from '../nft/index.js';

export class ElizaClient {
  private readonly http: HttpClient;
  private readonly authManager: AuthManager;
  private readonly baseUrl: string;

  // Lazy-loaded namespaced APIs
  private _characters?: CharactersAPI;
  private _chat?: ChatAPI;
  private _conversations?: ConversationsAPI;
  private _auth?: AuthAPI;
  private _nft?: NftAPI;

  constructor(config: ElizaClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');

    this.authManager = new AuthManager({
      apiKey: config.apiKey,
      accessToken: config.accessToken,
    });

    this.http = new HttpClient({
      baseUrl: this.baseUrl,
      timeout: config.timeout,
      retry: config.retry,
      getAuthHeader: () => this.authManager.getAuthHeader(),
    });

    this.authManager.setHttpClient(this.http);
  }

  /**
   * Verify the current credentials are valid
   */
  async verifyCredentials(): Promise<VerifyCredentialsResponse> {
    return this.http.get<VerifyCredentialsResponse>('/integration/verify');
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }

  /**
   * Access auth methods
   */
  get auth(): AuthAPI {
    if (!this._auth) {
      this._auth = new AuthAPI(this.authManager);
    }
    return this._auth;
  }

  /**
   * Access characters API
   */
  get characters(): CharactersAPI {
    if (!this._characters) {
      this._characters = new CharactersAPI(this.http);
    }
    return this._characters;
  }

  /**
   * Access chat API
   */
  get chat(): ChatAPI {
    if (!this._chat) {
      this._chat = new ChatAPI(this.http, () => this.authManager.getAuthHeader());
    }
    return this._chat;
  }

  /**
   * Access conversations API
   */
  get conversations(): ConversationsAPI {
    if (!this._conversations) {
      this._conversations = new ConversationsAPI(this.http);
    }
    return this._conversations;
  }

  /**
   * Access NFT API (collections + provisioning)
   */
  get nft(): NftAPI {
    if (!this._nft) {
      this._nft = new NftAPI(this.http);
    }
    return this._nft;
  }

  /**
   * Get the underlying HTTP client (for advanced usage)
   */
  getHttpClient(): HttpClient {
    return this.http;
  }
}

/**
 * Auth API wrapper
 */
class AuthAPI {
  constructor(private authManager: AuthManager) {}

  /**
   * Get a nonce for SIWE authentication
   */
  async getNonce(): Promise<NonceResponse> {
    return this.authManager.getNonce();
  }

  /**
   * Verify SIWE message and signature
   */
  async verify(message: string, signature: string, sessionId: string): Promise<AuthTokens> {
    return this.authManager.verify(message, signature, sessionId);
  }

  /**
   * Refresh the access token
   */
  async refresh(): Promise<void> {
    return this.authManager.refreshTokens();
  }

  /**
   * Clear authentication state
   */
  logout(): void {
    this.authManager.clearAuth();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }
}
