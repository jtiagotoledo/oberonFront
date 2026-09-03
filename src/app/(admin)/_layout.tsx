import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function AdminLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32', // Cor muv-verde
          },
          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',
          drawerActiveTintColor: '#2E7D32',
          drawerInactiveTintColor: '#4A5568',
          drawerLabelStyle: {
            fontSize: 15,
            fontWeight: '600',
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Início',
            title: 'Painel Geral',
          }}
        />
        <Drawer.Screen
          name="cadastrar-aluno"
          options={{
            drawerLabel: 'Cadastrar Aluno',
            title: 'Novo Aluno',
          }}
        />
        <Drawer.Screen
          name="cadastrar-professor"
          options={{
            drawerLabel: 'Cadastrar Professor',
            title: 'Novo Professor',
          }}
        />
        <Drawer.Screen
          name="cadastrar-admin"
          options={{
            drawerLabel: 'Cadastrar Administrador',
            title: 'Novo Administrador',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}