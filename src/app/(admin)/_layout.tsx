import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

function CustomDrawerContent({ navigation, state }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Configuração do Limite Dinâmico de Alunos por Horário
  const [limiteConfig, setLimiteConfig] = useState(4);
  const [novoLimiteInput, setNovoLimiteInput] = useState('4');
  const [modalConfigVisivel, setModalConfigVisivel] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const carregarConfigLimite = async () => {
    try {
      const res = await api.get('/api/configuracoes/limite-alunos');
      if (res.data?.limite) {
        setLimiteConfig(res.data.limite);
        setNovoLimiteInput(String(res.data.limite));
      }
    } catch {
      // Mantém padrão 4
    }
  };

  useEffect(() => {
    carregarConfigLimite();
  }, []);

  const handleSalvarLimite = async () => {
    const num = parseInt(novoLimiteInput, 10);
    if (isNaN(num) || num < 1 || num > 50) {
      Alert.alert('Valor inválido', 'Digite um número entre 1 e 50.');
      return;
    }

    try {
      setSalvandoConfig(true);
      const res = await api.put('/api/configuracoes/limite-alunos', { limite: num });
      setLimiteConfig(res.data.limite);
      setModalConfigVisivel(false);
      Alert.alert('Sucesso', `Capacidade alterada para ${res.data.limite} alunos por horário!`);
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao atualizar capacidade.';
      Alert.alert('Erro', msg);
    } finally {
      setSalvandoConfig(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Deseja realmente encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          navigation.closeDrawer();
          router.replace('/logout' as any);
        },
      },
    ]);
  };

  const rotas = [
    {
      nome: 'index',
      titulo: 'Visão Geral',
      icone: 'home-outline' as const,
      caminho: '/(admin)',
      params: {},
    },
    {
      nome: 'cadastrar-professor',
      titulo: 'Cadastrar Professor',
      icone: 'person-add-outline' as const,
      caminho: '/(admin)/cadastrar-professor',
      params: { id: '' },
    },
    {
      nome: 'cadastrar-aluno',
      titulo: 'Cadastrar Aluno',
      icone: 'people-outline' as const,
      caminho: '/(admin)/cadastrar-aluno',
      params: { id: '' },
    },
    {
      nome: 'cadastrar-admin',
      titulo: 'Cadastrar Admin',
      icone: 'shield-checkmark-outline' as const,
      caminho: '/(admin)/cadastrar-admin',
      params: { id: '' },
    },
    {
      nome: 'usuarios',
      titulo: 'Gerenciar Usuários',
      icone: 'people-circle-outline' as const,
      caminho: '/(admin)/usuarios',
      params: {},
    },
  ];

  const rotaAtivaNome = state?.routes[state.index]?.name;

  const iniciais = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <View className="flex-1 bg-white">
      {/* Cabeçalho do Usuário */}
      <View
        style={{ paddingTop: Math.max(insets.top, 20) + 12 }}
        className="pb-6 px-6 bg-gray-50 border-b border-gray-200"
      >
        <View className="w-14 h-14 rounded-full bg-muv-verde items-center justify-center mb-3 shadow-sm">
          <Text className="text-white font-bold text-lg">{iniciais}</Text>
        </View>

        <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
          {user?.name || 'Administrador'}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user?.email || 'admin@muvup.com'}
        </Text>

        <View className="self-start mt-2 px-2 py-0.5 rounded bg-green-100 border border-green-200">
          <Text className="text-[10px] font-bold text-muv-verde uppercase tracking-wide">
            {user?.role || 'Admin'}
          </Text>
        </View>
      </View>

      {/* Lista de Rotas */}
      <ScrollView className="flex-1 px-3 pt-4" showsVerticalScrollIndicator={false}>
        {rotas.map((item) => {
          const ativo = rotaAtivaNome === item.nome;

          return (
            <TouchableOpacity
              key={item.nome}
              onPress={() => {
                navigation.closeDrawer();
                router.push({ pathname: item.caminho as any, params: item.params });
              }}
              className={`flex-row items-center px-4 py-3.5 mb-1.5 rounded-xl ${
                ativo ? 'bg-green-50' : 'bg-transparent active:bg-gray-100'
              }`}
            >
              <Ionicons
                name={item.icone}
                size={22}
                color={ativo ? '#63B887' : '#4A5568'}
              />
              <Text
                className={`ml-3.5 text-sm font-semibold ${
                  ativo ? 'text-muv-verde font-bold' : 'text-gray-700'
                }`}
              >
                {item.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rodapé: Ajuste de Capacidade e Logout */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        className="px-4 pt-3 border-t border-gray-200 bg-gray-50 space-y-2"
      >
        <TouchableOpacity
          onPress={() => {
            carregarConfigLimite();
            setModalConfigVisivel(true);
          }}
          className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-200 mb-2 active:bg-gray-100"
        >
          <View className="flex-row items-center">
            <Ionicons name="options-outline" size={19} color="#4A5568" />
            <Text className="ml-3 font-semibold text-xs text-gray-700">Alunos por Horário</Text>
          </View>
          <View className="bg-green-50 border border-green-200 px-2 py-0.5 rounded">
            <Text className="text-[11px] font-bold text-muv-verde">{limiteConfig} max</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center px-4 py-3 rounded-xl bg-red-50 active:bg-red-100"
        >
          <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          <Text className="ml-3 font-semibold text-xs text-red-600">Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Configuração do Limite */}
      <Modal visible={modalConfigVisivel} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl">
            <View className="flex-row items-center mb-1">
              <Ionicons name="options-outline" size={20} color="#63B887" />
              <Text className="text-base font-bold text-gray-800 ml-2">Capacidade por Horário</Text>
            </View>
            <Text className="text-xs text-gray-500 mb-4 leading-relaxed">
              Defina a quantidade máxima de alunos que cada professor poderá atender no mesmo horário.
            </Text>

            <Text className="text-xs font-semibold text-gray-600 mb-1">LIMITE GLOBAL</Text>
            <TextInput
              value={novoLimiteInput}
              onChangeText={setNovoLimiteInput}
              keyboardType="numeric"
              maxLength={2}
              className="border border-gray-300 rounded-xl px-3 py-3 text-center text-xl font-bold text-gray-800 bg-gray-50 mb-4"
            />

            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                onPress={() => setModalConfigVisivel(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 active:bg-gray-200 mr-2"
              >
                <Text className="text-xs font-bold text-gray-600">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSalvarLimite}
                disabled={salvandoConfig}
                className="px-5 py-2.5 rounded-xl bg-muv-verde active:opacity-90 flex-row items-center"
              >
                {salvandoConfig ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-xs font-bold text-white">Salvar Regra</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#8C6E97' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold', color: '#FFFFFF' },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Visão Geral' }} />
        <Drawer.Screen name="cadastrar-professor" options={{ title: 'Novo Professor' }} />
        <Drawer.Screen name="cadastrar-aluno" options={{ title: 'Novo Aluno' }} />
        <Drawer.Screen name="cadastrar-admin" options={{ title: 'Novo Administrador' }} />
        <Drawer.Screen name="usuarios" options={{ title: 'Usuários Cadastrados' }} />
      </Drawer>
    </>
  );
}