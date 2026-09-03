import { useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

import '../global.css';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { token, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    SplashScreen.hideAsync();

    const rootSegment = (segments[0] as string) || '';
    const inAuthGroup =
      rootSegment === '(admin)' ||
      rootSegment === '(professor)' ||
      rootSegment === '(aluno)' ||
      pathname.includes('(admin)') ||
      pathname.includes('(professor)') ||
      pathname.includes('(aluno)');

    if (!token && inAuthGroup) {
      router.replace('/');
    } else if (token && user && !inAuthGroup) {
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'professor') {
        router.replace('/(professor)');
      } else {
        router.replace('/(aluno)');
      }
    }
  }, [token, user, hasHydrated, segments, pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationGuard />
    </QueryClientProvider>
  );
}