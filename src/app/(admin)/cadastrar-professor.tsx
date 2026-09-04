import { useState } from 'react';
import {  View,  Text,  TextInput,  TouchableOpacity,  ScrollView,  KeyboardAvoidingView,  Platform,  Alert,  ActivityIndicator,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const DIAS_SEMANA = [
  { id: 'Segunda-feira', label: 'Seg' },
  { id: 'Terça-feira', label: 'Ter' },
  { id: 'Quarta-feira', label: 'Qua' },
  { id: 'Quinta-feira', label: 'Qui' },
  { id: 'Sexta-feira', label: 'Sex' },
] as const;

type DiaSemanaTipo = (typeof DIAS_SEMANA)[number]['id'];

const HORARIOS_INICIO = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
];

export default function CadastrarProfessorScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  const [diaAtivo, setDiaAtivo] = useState<DiaSemanaTipo>('Segunda-feira');

  const [gradeHorarios, setGradeHorarios] = useState<Record<DiaSemanaTipo, string[]>>({
    'Segunda-feira': [],
    'Terça-feira': [],
    'Quarta-feira': [],
    'Quinta-feira': [],
    'Sexta-feira': [],
  });

  const alternarHorario = (horario: string) => {
    setGradeHorarios((prev) => {
      const horariosDoDia = prev[diaAtivo] || [];
      const jaExiste = horariosDoDia.includes(horario);

      return {
        ...prev,
        [diaAtivo]: jaExiste
          ? horariosDoDia.filter((h) => h !== horario)
          : [...horariosDoDia, horario].sort(),
      };
    });
  };

  const selecionarTurno = (periodo: 'manha' | 'tarde' | 'limpar') => {
    if (periodo === 'limpar') {
      setGradeHorarios((prev) => ({ ...prev, [diaAtivo]: [] }));
      return;
    }

    const novosHorarios =
      periodo === 'manha'
        ? ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00']
        : ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    setGradeHorarios((prev) => ({
      ...prev,
      [diaAtivo]: Array.from(new Set([...prev[diaAtivo], ...novosHorarios])).sort(),
    }));
  };

  const totalAulasSemana = Object.values(gradeHorarios).reduce(
    (total, lista) => total + lista.length,
    0
  );

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }

    const horariosFormatados = Object.entries(gradeHorarios)
      .filter(([_, slots]) => slots.length > 0)
      .map(([diaSemana, slots]) => ({
        diaSemana,
        slots,
      }));

    try {
      setLoading(true);
      await api.post('/api/professores', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        horarios: horariosFormatados,
      });

      Alert.alert(
        'Sucesso',
        'Professor cadastrado com sucesso! A senha provisória foi enviada por e-mail.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao cadastrar professor.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Dados Pessoais */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Dados Básicos
          </Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</Text>
              <TextInput
                placeholder="Ex: Carlos Silva"
                value={nome}
                onChangeText={setNome}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">E-MAIL</Text>
              <TextInput
                placeholder="professor@muvup.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">TELEFONE / WHATSAPP</Text>
              <TextInput
                placeholder="(15) 99999-9999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>
          </View>

          {/* Horários das Aulas */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Horário das Aulas
            </Text>
            <Text className="text-xs font-bold text-muv-verde bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              {totalAulasSemana} aulas/semana
            </Text>
          </View>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            {/* Seletor de Dias (Tabs) */}
            <View className="flex-row justify-between bg-gray-100 p-1 rounded-lg mb-4">
              {DIAS_SEMANA.map((dia) => {
                const ativo = diaAtivo === dia.id;
                const totalDia = gradeHorarios[dia.id]?.length || 0;

                return (
                  <TouchableOpacity
                    key={dia.id}
                    onPress={() => setDiaAtivo(dia.id)}
                    className={`flex-1 py-2 rounded-md items-center justify-center ${
                      ativo ? 'bg-muv-verde' : 'bg-transparent'
                    }`}
                  >
                    <Text className={`font-bold text-xs ${ativo ? 'text-white' : 'text-gray-600'}`}>
                      {dia.label}
                    </Text>
                    {totalDia > 0 && (
                      <Text
                        className={`text-[10px] font-semibold mt-0.5 ${
                          ativo ? 'text-white/90' : 'text-muv-verde'
                        }`}
                      >
                        {totalDia}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ações de Seleção Rápida */}
            <View className="flex-row justify-end space-x-2 mb-4">
              <TouchableOpacity
                onPress={() => selecionarTurno('limpar')}
                className="px-2.5 py-1 bg-red-50 rounded border border-red-100 ml-2"
              >
                <Text className="text-[11px] font-semibold text-red-500">Limpar</Text>
              </TouchableOpacity>
            </View>

            {/* Grade com 3 Colunas de Horários Simples */}
            <View className="flex-row flex-wrap justify-between">
              {HORARIOS_INICIO.map((hora) => {
                const selecionado = gradeHorarios[diaAtivo]?.includes(hora);
                return (
                  <TouchableOpacity
                    key={hora}
                    onPress={() => alternarHorario(hora)}
                    activeOpacity={0.7}
                    className={`w-[30%] py-3 mb-2.5 rounded-lg border items-center justify-center ${
                      selecionado
                        ? 'bg-muv-verde border-muv-verde'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selecionado ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botão de Envio */}
          <TouchableOpacity
            onPress={handleCadastrar}
            disabled={loading}
            className={`w-full py-4 rounded-xl items-center justify-center ${
              loading ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-90'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">Cadastrar Professor</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}