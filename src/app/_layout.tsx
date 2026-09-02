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

    // Aguarda a árvore de navegação concluir o ciclo de montagem inicial
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync();

      const inAuthGroup = segments[0] === '(admin)' || segments[0] === '(professor)' || segments[0] === '(aluno)';

      if (!token && inAuthGroup) {
        router.replace('/');
      } else if (token && user && !inAuthGroup) {
        if (user.role === 'admin') {
          router.replace('/(admin)/AdminScreen');
        } else if (user.role === 'professor') {
          router.replace('/(professor)/ProfessorScreen');
        } else {
          router.replace('/(aluno)/AlunoScreen');
        }
      }
    }, 0);

    return () => clearTimeout(timeout);
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