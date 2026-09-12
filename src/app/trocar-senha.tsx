import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function TrocarSenhaPrimeiroAcesso() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleTrocarSenha = async () => {
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/auth/trocar-senha-primeiro-acesso', {
        novaSenha: novaSenha.trim(),
      });

      if (user) {
        setUser({ ...user, primeiroAcesso: false });
      }

      Alert.alert('Sucesso', 'Senha atualizada! Bem-vindo ao sistema.', [
        {
          text: 'Entrar',
          onPress: () => {
            if (user?.role === 'aluno') router.replace('/(aluno)');
            else if (user?.role === 'professor') router.replace('/(professor)');
            else if (user?.role === 'admin') router.replace('/(admin)');
          },
        },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao atualizar a senha.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-8" style={{ paddingTop: insets.top + 40 }}>
      {/* Muda os ícones do topo do celular para escuros */}
      <StatusBar style="dark" />
      
      <View className="items-center mb-10 mt-6">
        <View className="w-20 h-20 bg-muv-verde/10 rounded-full items-center justify-center mb-6">
          <Ionicons name="lock-closed" size={40} color="#63B887" />
        </View>
        <Text className="text-3xl font-bold text-muv-verde text-center mb-2">Bem-vindo(a)!</Text>
        <Text className="text-gray-500 text-center text-base">
          Como este é o seu primeiro acesso, precisamos que você crie uma senha segura e definitiva.
        </Text>
      </View>

      <View className="w-full">
        <Text className="text-gray-700 font-semibold mb-2 ml-1">Nova Senha</Text>
        <View className="w-full relative justify-center mb-6">
          <TextInput
            className="w-full border border-gray-300 rounded-md pl-4 pr-12 py-3 text-base text-gray-800 bg-white"
            placeholder="Digite sua nova senha"
            placeholderTextColor="#A0AEC0"
            secureTextEntry={!mostrarSenha}
            value={novaSenha}
            onChangeText={setNovaSenha}
          />
          <TouchableOpacity 
            className="absolute right-3 p-1.5"
            onPress={() => setMostrarSenha(!mostrarSenha)}
            activeOpacity={0.7}
          >
            <Ionicons name={mostrarSenha ? "eye-off-outline" : "eye-outline"} size={22} color="#718096" />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-700 font-semibold mb-2 ml-1">Confirmar Nova Senha</Text>
        <View className="w-full relative justify-center mb-10">
          <TextInput
            className="w-full border border-gray-300 rounded-md pl-4 pr-12 py-3 text-base text-gray-800 bg-white"
            placeholder="Repita a nova senha"
            placeholderTextColor="#A0AEC0"
            secureTextEntry={!mostrarSenha}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />
        </View>

        <TouchableOpacity 
          onPress={handleTrocarSenha}
          disabled={loading}
          className={`w-full rounded-md py-4 items-center flex-row justify-center ${loading ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-80'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Salvar e Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}