import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { api } from '../../services/api';

export default function CadastrarAdminScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modoEdicao = Boolean(id);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: modoEdicao ? 'Editar Administrador' : 'Novo Administrador',
    });
  }, [navigation, modoEdicao]);

  useEffect(() => {
    if (id) {
      carregarAdmin();
    }
  }, [id]);

  const carregarAdmin = async () => {
    try {
      setLoadingDados(true);
      const res = await api.get(`/api/admins/${id}`);
      const data = res.data;

      setNome(data.nome || '');
      setEmail(data.email || '');
      setTelefone(data.telefone || '');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do administrador.');
    } finally {
      setLoadingDados(false);
    }
  };

  const handleSalvar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      setLoadingSalvar(true);
      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
      };

      if (modoEdicao) {
        await api.put(`/api/admins/${id}`, payload);
        Alert.alert('Sucesso', 'Administrador atualizado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await api.post('/api/admins', payload);
        Alert.alert('Sucesso', 'Administrador cadastrado com sucesso! A senha inicial foi enviada por e-mail.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao salvar administrador.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingDados) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#63B887" />
        <Text className="text-gray-500 text-sm mt-3 font-medium">Carregando dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dados Pessoais</Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</Text>
              <TextInput
                placeholder="Ex: Ana Souza"
                value={nome}
                onChangeText={setNome}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">E-MAIL</Text>
              <TextInput
                placeholder="ana@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">TELEFONE</Text>
              <TextInput
                placeholder="(15) 99999-9999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSalvar}
            disabled={loadingSalvar}
            className={`w-full py-4 rounded-xl items-center justify-center ${
              loadingSalvar ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-90'
            }`}
          >
            {loadingSalvar ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {modoEdicao ? 'Atualizar Administrador' : 'Cadastrar Administrador'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}