import { useState } from 'react';
import {  View,  Text,  TextInput,  TouchableOpacity,  KeyboardAvoidingView,  Platform,  TouchableWithoutFeedback,  Keyboard,  ScrollView,  Alert,  ActivityIndicator,} from 'react-native';
import { api } from '../../services/api';

export default function CadastrarAdminScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await api.post('/api/admins', {
        nome,
        email: email.trim().toLowerCase(),
        telefone,
      });

      Alert.alert(
        'Sucesso!',
        'Administrador cadastrado. As instruções de primeiro acesso foram enviadas.',
        [
          {
            text: 'OK',
            onPress: () => {
              setNome('');
              setEmail('');
              setTelefone('');
            },
          },
        ]
      );
    } catch (error: any) {
      const mensagemErro =
        error.response?.data?.erro ||
        error.response?.data?.mensagem ||
        'Não foi possível cadastrar o administrador.';
      Alert.alert('Erro no cadastro', mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              Novo Administrador
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              O novo gestor terá acesso total aos cadastros, horários e relatórios do estúdio.
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Nome Completo
              </Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white focus:border-muv-verde"
                placeholder="Ex: Maria Silva"
                placeholderTextColor="#A0AEC0"
                editable={!isLoading}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                E-mail
              </Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white focus:border-muv-verde"
                placeholder="exemplo@muvup.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                Telefone / WhatsApp
              </Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white focus:border-muv-verde"
                placeholder="(00) 00000-0000"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                editable={!isLoading}
                value={telefone}
                onChangeText={setTelefone}
              />
            </View>

            <TouchableOpacity
              className={`w-full rounded-xl py-4 items-center justify-center flex-row shadow-sm ${
                isLoading ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-85'
              }`}
              onPress={handleCadastrar}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Cadastrar Administrador
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}