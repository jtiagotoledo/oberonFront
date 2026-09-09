import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/useAuthStore';

function CustomDrawerContent({ navigation, state }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
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
      titulo: 'Minha Semana',
      icone: 'calendar-outline' as const,
      caminho: '/(aluno)',
    },
    {
      nome: 'reagendar',
      titulo: 'Reagendar Aula',
      icone: 'swap-horizontal-outline' as const,
      caminho: '/(aluno)/reagendar',
    },
  ];

  const rotaAtivaNome = state?.routes[state.index]?.name;
  const iniciais = user?.name ? user.name.substring(0, 2).toUpperCase() : 'AL';

  return (
    <View className="flex-1 bg-white">
      <View
        style={{ paddingTop: Math.max(insets.top, 20) + 12 }}
        className="pb-6 px-6 bg-gray-50 border-b border-gray-200"
      >
        <View className="w-14 h-14 rounded-full bg-muv-roxo items-center justify-center mb-3 shadow-sm">
          <Text className="text-white font-bold text-lg">{iniciais}</Text>
        </View>

        <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
          {user?.name || 'Aluno'}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user?.email || 'aluno@muvup.com'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-3 pt-4">
        {rotas.map((item) => {
          const ativo = rotaAtivaNome === item.nome;
          return (
            <TouchableOpacity
              key={item.nome}
              onPress={() => {
                navigation.closeDrawer();
                router.push(item.caminho as any);
              }}
              className={`flex-row items-center px-4 py-3.5 mb-1.5 rounded-xl ${
                ativo ? 'bg-muv-roxo/10' : 'bg-transparent active:bg-gray-100'
              }`}
            >
              <Ionicons name={item.icone} size={22} color={ativo ? '#8C6E97' : '#4A5568'} />
              <Text className={`ml-3.5 text-sm font-semibold ${ativo ? 'text-muv-roxo' : 'text-gray-700'}`}>
                {item.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }} className="px-4 pt-3 border-t border-gray-200 bg-gray-50">
        <TouchableOpacity onPress={handleLogout} className="flex-row items-center px-4 py-3 rounded-xl bg-red-50 active:bg-red-100">
          <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          <Text className="ml-3 font-semibold text-xs text-red-600">Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AlunoLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#8C6E97' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Minha Semana' }} />
        <Drawer.Screen name="reagendar" options={{ title: 'Reagendar' }} />
      </Drawer>
    </>
  );
}