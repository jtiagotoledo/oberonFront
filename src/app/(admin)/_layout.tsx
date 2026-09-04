import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/useAuthStore';

function CustomDrawerContent({ navigation, state }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

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
    },
    {
      nome: 'cadastrar-professor',
      titulo: 'Cadastrar Professor',
      icone: 'person-add-outline' as const,
      caminho: '/(admin)/cadastrar-professor',
    },
    {
      nome: 'cadastrar-aluno',
      titulo: 'Cadastrar Aluno',
      icone: 'people-outline' as const,
      caminho: '/(admin)/cadastrar-aluno',
    },
    {
      nome: 'cadastrar-admin',
      titulo: 'Cadastrar Admin',
      icone: 'shield-checkmark-outline' as const,
      caminho: '/(admin)/cadastrar-admin',
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
      {/* 1. Header do Usuário */}
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

      {/* 2. Lista de Navegação */}
      <ScrollView className="flex-1 px-3 pt-4" showsVerticalScrollIndicator={false}>
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

      {/* 3. Rodapé com Botão Sair protegido pela Safe Area */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        className="px-4 pt-4 border-t border-gray-200 bg-gray-50"
      >
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center px-4 py-3.5 rounded-xl bg-red-50 active:bg-red-100"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="ml-3 font-semibold text-sm text-red-600">Sair da Conta</Text>
        </TouchableOpacity>
      </View>
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
          headerStyle: {
            backgroundColor: '#8C6E97',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#FFFFFF',
          },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Visão Geral' }} />
        <Drawer.Screen name="cadastrar-professor" options={{ title: 'Novo Professor' }} />
        <Drawer.Screen name="cadastrar-aluno" options={{ title: 'Novo Aluno' }} />
        <Drawer.Screen name="cadastrar-admin" options={{ title: 'Novo Administrador' }} />
      </Drawer>
    </>
  );
}