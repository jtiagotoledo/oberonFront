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
      
    const isTrocarSenha = pathname === '/trocar-senha';

    // 1. Não tem token e tenta acessar área restrita ou troca de senha -> Login
    if (!token && (inAuthGroup || isTrocarSenha)) {
      router.replace('/');
      return;
    } 
    
    // 2. Tem token e usuário logado
    if (token && user) {
      if (user.primeiroAcesso) {
        // Se for primeiro acesso e NÃO estiver na tela de troca, força ir pra lá
        if (!isTrocarSenha) {
          router.replace('/trocar-senha');
        }
      } else {
        // Se NÃO for primeiro acesso e estiver fora dos painéis (ex: na tela de login), manda pro painel
        if (!inAuthGroup) {
          if (user.role === 'admin') {
            router.replace('/(admin)');
          } else if (user.role === 'professor') {
            router.replace('/(professor)');
          } else {
            router.replace('/(aluno)');
          }
        }
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