import { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    console.log('Tentando logar com:', email, senha);
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
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-8 text-base text-gray-800 bg-white"
                placeholder="Senha"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />

              <TouchableOpacity
                className="w-full bg-muv-verde rounded-md py-4 items-center active:opacity-80"
                onPress={handleLogin}
              >
                <Text className="text-white font-bold text-lg">
                  Entrar
                </Text>
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