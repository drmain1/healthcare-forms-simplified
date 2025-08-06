interface GoogleUser {
  getAuthResponse(): {
    id_token: string;
    access_token: string;
    expires_at: number;
  };
  getBasicProfile(): {
    getEmail(): string;
    getName(): string;
    getGivenName(): string;
    getFamilyName(): string;
    getImageUrl(): string;
  };
}

interface GoogleAuth {
  signIn(): Promise<GoogleUser>;
  signOut(): Promise<void>;
  isSignedIn: {
    get(): boolean;
    listen(callback: (isSignedIn: boolean) => void): void;
  };
  currentUser: {
    get(): GoogleUser | null;
    listen(callback: (user: GoogleUser) => void): void;
  };
}

class GoogleAuthService {
  private auth2: GoogleAuth | null = null;
  private clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('auth2', () => {
          (window as any).gapi.auth2
            .init({
              client_id: this.clientId,
              scope: 'email profile',
              prompt: 'select_account'
            })
            .then((auth: GoogleAuth) => {
              this.auth2 = auth;
              this.initialized = true;
              resolve();
            })
            .catch(reject);
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async signIn(): Promise<{ idToken: string; user: any }> {
    if (!this.auth2) {
      await this.init();
    }

    try {
      const googleUser = await this.auth2!.signIn();
      const authResponse = googleUser.getAuthResponse();
      const profile = googleUser.getBasicProfile();

      return {
        idToken: authResponse.id_token,
        user: {
          email: profile.getEmail(),
          name: profile.getName(),
          firstName: profile.getGivenName(),
          lastName: profile.getFamilyName(),
          imageUrl: profile.getImageUrl()
        }
      };
    } catch (error) {
      
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.auth2) return;
    await this.auth2.signOut();
  }

  isSignedIn(): boolean {
    if (!this.auth2) return false;
    return this.auth2.isSignedIn.get();
  }

  getCurrentUser(): { idToken: string; user: any } | null {
    if (!this.auth2 || !this.isSignedIn()) return null;

    const googleUser = this.auth2.currentUser.get();
    if (!googleUser) return null;

    const authResponse = googleUser.getAuthResponse();
    const profile = googleUser.getBasicProfile();

    return {
      idToken: authResponse.id_token,
      user: {
        email: profile.getEmail(),
        name: profile.getName(),
        firstName: profile.getGivenName(),
        lastName: profile.getFamilyName(),
        imageUrl: profile.getImageUrl()
      }
    };
  }

  getIdToken(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.idToken : null;
  }

  onAuthStateChanged(callback: (user: any) => void): void {
    if (!this.auth2) {
      this.init().then(() => {
        this.auth2!.currentUser.listen((googleUser) => {
          if (googleUser && this.isSignedIn()) {
            const profile = googleUser.getBasicProfile();
            callback({
              email: profile.getEmail(),
              name: profile.getName(),
              firstName: profile.getGivenName(),
              lastName: profile.getFamilyName(),
              imageUrl: profile.getImageUrl()
            });
          } else {
            callback(null);
          }
        });
      });
    } else {
      this.auth2.currentUser.listen((googleUser) => {
        if (googleUser && this.isSignedIn()) {
          const profile = googleUser.getBasicProfile();
          callback({
            email: profile.getEmail(),
            name: profile.getName(),
            firstName: profile.getGivenName(),
            lastName: profile.getFamilyName(),
            imageUrl: profile.getImageUrl()
          });
        } else {
          callback(null);
        }
      });
    }
  }
}

export const googleAuthService = new GoogleAuthService();
export default googleAuthService;