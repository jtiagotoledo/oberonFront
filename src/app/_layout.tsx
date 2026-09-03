import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

import '../global.css';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { token, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    SplashScreen.hideAsync();

    // segments[0] identifica o grupo atual: '(admin)', '(professor)', '(aluno)' ou undefined (raiz)
    const inAuthGroup =
      segments[0] === '(admin)' ||
      segments[0] === '(professor)' ||
      segments[0] === '(aluno)';

    if (!token && inAuthGroup) {
      // Sai do grupo protegido e força o retorno para a tela de Login
      router.replace('/');
    } else if (token && user && !inAuthGroup) {
      // Se tiver token e estiver na tela de Login, manda para a área do perfil
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'professor') {
        router.replace('/(professor)/ProfessorScreen');
      } else {
        router.replace('/(aluno)/AlunoScreen');
      }
    }
  }, [token, user, hasHydrated, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationGuard />
    </QueryClientProvider>
  );
}