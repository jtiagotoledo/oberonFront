import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function LogoutScreen() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let ativo = true;

    async function sair() {
      try {
        await logout();
      } catch (err) {
        console.error('Erro no logout:', err);
      } finally {
        if (ativo) {
          router.replace('/');
        }
      }
    }

    sair();

    return () => {
      ativo = false;
    };
  }, [logout]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#63B887" />
    </View>
  );
}