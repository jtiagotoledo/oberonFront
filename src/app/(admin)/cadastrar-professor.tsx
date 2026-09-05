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
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
] as const;

export default function CadastrarProfessorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modoEdicao = Boolean(id);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<(typeof DIAS_SEMANA)[number]>('Segunda-feira');
  const [gradeHorarios, setGradeHorarios] = useState<Record<string, string[]>>({
    'Segunda-feira': [],
    'Terça-feira': [],
    'Quarta-feira': [],
    'Quinta-feira': [],
    'Sexta-feira': [],
  });

  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');

  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: modoEdicao ? 'Editar Professor' : 'Novo Professor',
    });
  }, [navigation, modoEdicao]);

  useEffect(() => {
    if (id) {
      carregarProfessor();
    }
  }, [id]);

  const carregarProfessor = async () => {
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
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do professor.');
    } finally {
      setLoadingDados(false);
    }
  };

  const gerarIntervalos = () => {
    const inicio = parseInt(horaInicio, 10);
    const fim = parseInt(horaFim, 10);

    if (isNaN(inicio) || isNaN(fim) || inicio >= fim || inicio < 5 || fim > 23) {
      Alert.alert('Horário Inválido', 'Insira horas cheias válidas (ex: das 07 às 12).');
      return;
    }

    const novosSlots: string[] = [];
    for (let h = inicio; h < fim; h++) {
      const formatado = `${String(h).padStart(2, '0')}:00`;
      if (!novosSlots.includes(formatado)) {
        novosSlots.push(formatado);
      }
    }

    setGradeHorarios((prev) => {
      const slotsExistentes = prev[diaSelecionado] || [];
      const uniao = Array.from(new Set([...slotsExistentes, ...novosSlots])).sort();
      return { ...prev, [diaSelecionado]: uniao };
    });

    setHoraInicio('');
    setHoraFim('');
  };

  const removerSlot = (slot: string) => {
    setGradeHorarios((prev) => ({
      ...prev,
      [diaSelecionado]: prev[diaSelecionado].filter((s) => s !== slot),
    }));
  };

  const handleSalvar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }

    const horariosFormatados = Object.entries(gradeHorarios)
      .filter(([_, slots]) => slots.length > 0)
      .map(([diaSemana, slots]) => ({ diaSemana, slots }));

    if (horariosFormatados.length === 0) {
      Alert.alert('Atenção', 'Cadastre ao menos um horário de atendimento para o professor.');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dados Pessoais</Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</Text>
              <TextInput
                placeholder="Ex: Roberto Silva"
                value={nome}
                onChangeText={setNome}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">E-MAIL</Text>
              <TextInput
                placeholder="roberto@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">TELEFONE</Text>
              <TextInput
                placeholder="(15) 99999-9999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>
          </View>

          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Disponibilidade de Horários</Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            {/* Seletor de dia */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row">
                {DIAS_SEMANA.map((dia) => {
                  const ativo = diaSelecionado === dia;
                  const totalSlots = gradeHorarios[dia]?.length || 0;
                  return (
                    <TouchableOpacity
                      key={dia}
                      onPress={() => setDiaSelecionado(dia)}
                      className={`mr-2 px-3 py-2 rounded-lg border ${
                        ativo ? 'bg-muv-verde border-muv-verde' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${ativo ? 'text-white' : 'text-gray-700'}`}>
                        {dia.replace('-feira', '')} {totalSlots > 0 ? `(${totalSlots})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Inserir intervalo */}
            <View className="flex-row items-center mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-[10px] font-bold text-gray-500 mb-1">INÍCIO (HORA)</Text>
                <TextInput
                  placeholder="07"
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  keyboardType="numeric"
                  maxLength={2}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-gray-800 bg-white"
                />
              </View>

              <View className="flex-1 mr-2">
                <Text className="text-[10px] font-bold text-gray-500 mb-1">FIM (HORA)</Text>
                <TextInput
                  placeholder="12"
                  value={horaFim}
                  onChangeText={setHoraFim}
                  keyboardType="numeric"
                  maxLength={2}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-gray-800 bg-white"
                />
              </View>

              <TouchableOpacity
                onPress={gerarIntervalos}
                className="mt-4 px-4 py-2.5 rounded-lg bg-gray-800 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">Adicionar</Text>
              </TouchableOpacity>
            </View>

            {/* Slots cadastrados para o dia */}
            <Text className="text-xs font-semibold text-gray-600 mb-2">Horários de {diaSelecionado}:</Text>
            {slotsDoDia.length === 0 ? (
              <Text className="text-xs text-gray-400 italic">Nenhum horário definido para este dia.</Text>
            ) : (
              <View className="flex-row flex-wrap">
                {slotsDoDia.map((slot) => (
                  <View
                    key={slot}
                    className="flex-row items-center bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 mr-2 mb-2"
                  >
                    <Text className="text-xs font-bold text-muv-verde mr-1.5">{slot}</Text>
                    <TouchableOpacity onPress={() => removerSlot(slot)}>
                      <Ionicons name="close-circle" size={14} color="#63B887" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSalvar}
            disabled={loadingSalvar}
            className={`w-full py-4 rounded-xl items-center justify-center ${
              loadingSalvar ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-90'
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