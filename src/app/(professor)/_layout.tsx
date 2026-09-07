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
      titulo: 'Minha Agenda',
      icone: 'calendar-outline' as const,
      caminho: '/(professor)',
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
          {user?.name || 'Professor'}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user?.email || 'professor@muvup.com'}
        </Text>

        <View className="self-start mt-2 px-2 py-0.5 rounded bg-green-100 border border-green-200">
          <Text className="text-[10px] font-bold text-muv-verde uppercase tracking-wide">
            {user?.role || 'Professor'}
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

      {/* Rodapé: Logout */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        className="px-4 pt-3 border-t border-gray-200 bg-gray-50"
      >
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center px-4 py-3 rounded-xl bg-red-50 active:bg-red-100"
        >
          <Ionicons name="log-out-outline" size={19} color="#EF4444" />
          <Text className="ml-3 font-semibold text-xs text-red-600">Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ProfessorLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#63B887' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold', color: '#FFFFFF' },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ title: 'Minha Agenda' }} 
        />
        
        {/* Oculta a tela de detalhes do menu lateral e adiciona botão de voltar customizado */}
        <Drawer.Screen 
          name="semana/[id]" 
          options={{ 
            title: 'Detalhes da Semana',
            drawerItemStyle: { display: 'none' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, padding: 4 }}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )
          }} 
        />
      </Drawer>
    </>
  );
}