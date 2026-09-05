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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { api } from '../../services/api';

const DIAS = [
  { key: 'Segunda-feira', label: 'Seg' },
  { key: 'Terça-feira', label: 'Ter' },
  { key: 'Quarta-feira', label: 'Qua' },
  { key: 'Quinta-feira', label: 'Qui' },
  { key: 'Sexta-feira', label: 'Sex' },
] as const;

const HORARIOS_DISPONIVEIS = [
  '06:00', '07:00', '08:00',
  '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

export default function CadastrarProfessorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modoEdicao = Boolean(id);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<string>('Segunda-feira');

  const [gradeHorarios, setGradeHorarios] = useState<Record<string, string[]>>({
    'Segunda-feira': [],
    'Terça-feira': [],
    'Quarta-feira': [],
    'Quinta-feira': [],
    'Sexta-feira': [],
  });

  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setDiaSelecionado('Segunda-feira');
    setGradeHorarios({
      'Segunda-feira': [],
      'Terça-feira': [],
      'Quarta-feira': [],
      'Quinta-feira': [],
      'Sexta-feira': [],
    });
  };

  useEffect(() => {
    async function carregarProfessor() {
      if (!id) {
        limparFormulario();
        return;
      }

      try {
        setLoadingDados(true);
        const res = await api.get(`/api/professores/${id}`);
        const data = res.data;

        setNome(data.nome || '');
        setEmail(data.email || '');
        setTelefone(data.telefone || '');

        const novaGrade: Record<string, string[]> = {
          'Segunda-feira': [],
          'Terça-feira': [],
          'Quarta-feira': [],
          'Quinta-feira': [],
          'Sexta-feira': [],
        };

        data.horarios?.forEach((h: { diaSemana: string; slots: string[] }) => {
          if (novaGrade[h.diaSemana]) {
            novaGrade[h.diaSemana] = h.slots || [];
          }
        });

        setGradeHorarios(novaGrade);
      } catch (error: any) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do professor.');
      } finally {
        setLoadingDados(false);
      }
    }

    carregarProfessor();
  }, [id]);

  const toggleHorario = (horario: string) => {
    setGradeHorarios((prev) => {
      const atuais = prev[diaSelecionado] || [];
      const existe = atuais.includes(horario);
      const atualizados = existe
        ? atuais.filter((h) => h !== horario)
        : [...atuais, horario].sort();

      return {
        ...prev,
        [diaSelecionado]: atualizados,
      };
    });
  };

  const limparDiaAtual = () => {
    setGradeHorarios((prev) => ({
      ...prev,
      [diaSelecionado]: [],
    }));
  };

  const totalAulasSemanais = Object.values(gradeHorarios).reduce(
    (total, slots) => total + slots.length,
    0
  );

  const handleSalvar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }

    const horariosFormatados = Object.entries(gradeHorarios)
      .filter(([_, slots]) => slots.length > 0)
      .map(([diaSemana, slots]) => ({ diaSemana, slots }));

    if (horariosFormatados.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um horário de atendimento.');
      return;
    }

    try {
      setLoadingSalvar(true);
      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        horarios: horariosFormatados,
      };

      if (modoEdicao) {
        await api.put(`/api/professores/${id}`, payload);
        Alert.alert('Sucesso', 'Professor atualizado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await api.post('/api/professores', payload);
        Alert.alert('Sucesso', 'Professor cadastrado com sucesso! A senha inicial foi enviada por e-mail.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao salvar professor.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingSalvar(false);
    }
  };

  if (loadingDados) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#63B887" />
        <Text className="text-gray-500 text-sm mt-3 font-medium">Carregando professor...</Text>
      </View>
    );
  }

  const slotsDoDia = gradeHorarios[diaSelecionado] || [];

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
      {/* Define o título dinamicamente de forma segura dentro do layout do Drawer */}
      <Drawer.Screen options={{ title: modoEdicao ? 'Editar Professor' : 'Novo Professor' }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Dados Básicos */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Dados Básicos
          </Text>

          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</Text>
              <TextInput
                placeholder="Ex: Carlos Silva"
                value={nome}
                onChangeText={setNome}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-4">
              <Text className="text-xs font-semibold text-gray-600 mb-1">E-MAIL</Text>
              <TextInput
                placeholder="professor@muvup.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-4">
              <Text className="text-xs font-semibold text-gray-600 mb-1">TELEFONE / WHATSAPP</Text>
              <TextInput
                placeholder="(15) 99999-9999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>
          </View>

          {/* Horário das Aulas */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Horário das Aulas
            </Text>
            <View className="bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-muv-verde">
                {totalAulasSemanais} aulas/semana
              </Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
            {/* Seletor de Dias */}
            <View className="flex-row justify-between mb-4 bg-gray-100 p-1 rounded-xl">
              {DIAS.map((dia) => {
                const ativo = diaSelecionado === dia.key;
                return (
                  <TouchableOpacity
                    key={dia.key}
                    onPress={() => setDiaSelecionado(dia.key)}
                    style={{ backgroundColor: ativo ? '#63B887' : 'transparent' }}
                    className="flex-1 py-2 rounded-lg items-center"
                  >
                    <Text
                      style={{ color: ativo ? '#FFFFFF' : '#4A5568' }}
                      className="text-xs font-bold"
                    >
                      {dia.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Limpar Dia */}
            <View className="flex-row justify-end mb-3">
              <TouchableOpacity
                onPress={limparDiaAtual}
                className="px-3 py-1 rounded-md bg-red-50 border border-red-100"
              >
                <Text className="text-xs font-bold text-red-500">Limpar</Text>
              </TouchableOpacity>
            </View>

            {/* Chips de Horários */}
            <View className="flex-row flex-wrap justify-between">
              {HORARIOS_DISPONIVEIS.map((hora) => {
                const selecionado = slotsDoDia.includes(hora);
                return (
                  <TouchableOpacity
                    key={hora}
                    onPress={() => toggleHorario(hora)}
                    style={{
                      backgroundColor: selecionado ? '#63B887' : '#FFFFFF',
                      borderColor: selecionado ? '#63B887' : '#E2E8F0',
                    }}
                    className="w-[31%] py-3 mb-3 rounded-xl border items-center justify-center"
                  >
                    <Text
                      style={{ color: selecionado ? '#FFFFFF' : '#2D3748' }}
                      className="text-sm font-bold"
                    >
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleSalvar}
            disabled={loadingSalvar}
            className={`w-full py-4 rounded-2xl items-center justify-center ${
              loadingSalvar ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-90 shadow-sm'
            }`}
          >
            {loadingSalvar ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {modoEdicao ? 'Atualizar Professor' : 'Cadastrar Professor'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}