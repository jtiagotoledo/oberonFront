import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function AdminLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8C6E97', 
          },
          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',
          drawerActiveTintColor: '#63B887',
          drawerInactiveTintColor: '#8C6E97',
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