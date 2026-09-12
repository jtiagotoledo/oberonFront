import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';

export default function AlterarSenhaScreen() {
  const router = useRouter();
  
  // Nota: Para segurança em trocas voluntárias, é ideal que o backend exija a senha atual.
  // Se a sua API ainda não possui a rota /api/auth/alterar-senha com validação da senha antiga,
  // você pode adaptar o backend para criá-la.
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  const handleSalvar = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As novas senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      // Aqui você chamará a rota dedicada a troca voluntária de senha com a validação da senha antiga
      await api.post('/api/auth/alterar-senha', {
        senhaAtual: senhaAtual.trim(),
        novaSenha: novaSenha.trim(),
      });

      Alert.alert('Sucesso', 'Sua senha foi atualizada.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao alterar a senha. Verifique sua senha atual.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-gray-800 text-lg font-bold mb-6">Mantenha sua conta segura</Text>

      <Text className="text-gray-700 font-bold mb-2 ml-1">Senha Atual</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 mb-4 shadow-sm">
        <Ionicons name="lock-closed-outline" size={20} color="#718096" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Digite a senha atual"
          secureTextEntry={!mostrarSenhas}
          value={senhaAtual}
          onChangeText={setSenhaAtual}
        />
        <TouchableOpacity onPress={() => setMostrarSenhas(!mostrarSenhas)}>
          <Ionicons name={mostrarSenhas ? "eye-off-outline" : "eye-outline"} size={20} color="#A0AEC0" />
        </TouchableOpacity>
      </View>

      <Text className="text-gray-700 font-bold mb-2 ml-1">Nova Senha</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 mb-4 shadow-sm">
        <Ionicons name="key-outline" size={20} color="#8C6E97" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Digite a nova senha"
          secureTextEntry={!mostrarSenhas}
          value={novaSenha}
          onChangeText={setNovaSenha}
        />
      </View>

      <Text className="text-gray-700 font-bold mb-2 ml-1">Confirmar Nova Senha</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-14 mb-8 shadow-sm">
        <Ionicons name="checkmark-circle-outline" size={20} color="#8C6E97" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Repita a nova senha"
          secureTextEntry={!mostrarSenhas}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />
      </View>

      <TouchableOpacity 
        onPress={handleSalvar}
        disabled={loading}
        className={`h-14 rounded-xl items-center justify-center shadow-sm ${loading ? 'bg-muv-teal/70' : 'bg-muv-teal active:opacity-80'}`}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Atualizar Senha</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}