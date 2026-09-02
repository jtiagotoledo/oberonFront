import { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', { email, senha });
      const { token, usuario } = response.data;

      login(
        {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role
        },
        token
      );

      if (usuario.role === 'admin') {
        router.replace('/(admin)/AdminScreen');
      } else if (usuario.role === 'professor') {
        router.replace('/(professor)/ProfessorScreen');
      } else {
        router.replace('/(aluno)/AlunoScreen');
      }

    } catch (error: any) {
      console.log(error);
      
      const mensagemErro = error.response?.data?.erro || 'Não foi possível conectar ao servidor.';
      Alert.alert('Erro ao entrar', mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
            className="px-8"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            <View className="items-center mb-8">
              <Image
                source={require('../../assets/logo/logo.png')}
                className="w-48 h-48"
                resizeMode="contain"
              />
            </View>

            <Text className="text-4xl font-bold text-muv-verde text-center mb-10">
              Login
            </Text>

            <View className="w-full">
              <TextInput
                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 text-base text-gray-800 bg-white"
                placeholder="E-mail"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-8 text-base text-gray-800 bg-white"
                placeholder="Senha"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                editable={!isLoading}
                value={senha}
                onChangeText={setSenha}
              />

              <TouchableOpacity
                className={`w-full rounded-md py-4 items-center flex-row justify-center ${isLoading ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-80'}`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Entrar
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity className="mt-6 items-center">
                <Text className="text-blue-600 font-medium text-base underline decoration-blue-600">
                  Esqueci minha senha
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}