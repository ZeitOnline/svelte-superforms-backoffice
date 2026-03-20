declare module '@zeitonline/svelte-oidc' {
  export type OidcManageOptions = {
    authority: string;
    client_id: string;
    [key: string]: unknown;
  };

  export type OidcState = {
    manager: unknown;
    isAuthenticated: boolean;
    accessToken: string | null;
    idToken: string | null;
    userInfo: Record<string, unknown>;
    error: unknown;
    loading: boolean;
    manage: (args: OidcManageOptions) => Promise<void>;
    login: () => Promise<unknown>;
  };

  export const oidc: OidcState;
}
