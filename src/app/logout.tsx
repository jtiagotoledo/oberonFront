import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function LogoutScreen() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    logout();
    router.replace('/');
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#63B887" />
    </View>
  );
}