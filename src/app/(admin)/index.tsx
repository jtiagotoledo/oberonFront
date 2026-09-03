import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-2xl font-bold text-muv-roxo mb-2">Área do Admin</Text>
      <Text className="text-lg text-gray-600 mb-8">Bem-vindo, {user?.name}</Text>
      
      <TouchableOpacity onPress={handleLogout} className="bg-red-500 px-6 py-3 rounded-md">
        <Text className="text-white font-bold">Sair</Text>
      </TouchableOpacity>
    </View>
  );
}