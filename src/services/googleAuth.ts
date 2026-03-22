import * as AuthSession from 'expo-auth-session';


const CLIENT_ID = '695475393988-1eqkg3n58hgfo4rnb7vgc781823nlon6.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'your-app-scheme', // matching your app.json
    preferLocalhost: true,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      redirectUri,
      usePKCE: false,
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  return { request, response, promptAsync };
}