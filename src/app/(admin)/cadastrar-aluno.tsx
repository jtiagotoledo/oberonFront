import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface HorarioProfessor {
  diaSemana: 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira';
  slots: string[];
}

interface Professor {
  _id: string;
  nome: string;
  horarios: HorarioProfessor[];
}

interface AulaSelecionada {
  diaSemana: string;
  horario: string;
}

export default function CadastrarAlunoScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');

  // Lista de professores vinda do backend
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);
  const [carregandoProfessores, setCarregandoProfessores] = useState(false);

  // Aulas semanais e grade de horários
  const [qtdAulas, setQtdAulas] = useState(2);
  const [aulas, setAulas] = useState<AulaSelecionada[]>([
    { diaSemana: '', horario: '' },
    { diaSemana: '', horario: '' },
  ]);

  const [loadingSalvar, setLoadingSalvar] = useState(false);

  // Estados dos Modais de Seleção
  const [modalProfVisible, setModalProfVisible] = useState(false);
  const [modalDiaVisible, setModalDiaVisible] = useState(false);
  const [modalHoraVisible, setModalHoraVisible] = useState(false);
  const [indexAulaEditando, setIndexAulaEditando] = useState<number>(0);

  useEffect(() => {
    carregarProfessores();
  }, []);

  const carregarProfessores = async () => {
    try {
      setCarregandoProfessores(true);
      const res = await api.get('/api/professores');
      setProfessores(res.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a lista de professores.');
    } finally {
      setCarregandoProfessores(false);
    }
  };

  // Ajusta o array de aulas quando o usuário muda a quantidade contratada
  const alterarQuantidadeAulas = (novaQtd: number) => {
    setQtdAulas(novaQtd);
    setAulas((prev) => {
      const novaLista = [...prev];
      if (novaQtd > prev.length) {
        while (novaLista.length < novaQtd) {
          novaLista.push({ diaSemana: '', horario: '' });
        }
      } else {
        novaLista.splice(novaQtd);
      }
      return novaLista;
    });
  };

  // Atualiza um campo de uma aula específica
  const atualizarAula = (index: number, campo: 'diaSemana' | 'horario', valor: string) => {
    setAulas((prev) => {
      const novaLista = [...prev];
      if (campo === 'diaSemana') {
        novaLista[index] = { diaSemana: valor, horario: '' }; // Reseta a hora ao trocar o dia
      } else {
        novaLista[index] = { ...novaLista[index], horario: valor };
      }
      return novaLista;
    });
  };

  // Filtra os horários disponíveis do professor para o dia daquela aula específica
  const getSlotsDisponiveis = (dia: string) => {
    if (!professorSelecionado) return [];
    const diaEncontrado = professorSelecionado.horarios?.find((h) => h.diaSemana === dia);
    return diaEncontrado ? diaEncontrado.slots : [];
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !professorSelecionado) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios e selecione o professor.');
      return;
    }

    const aulasIncompletas = aulas.some((a) => !a.diaSemana || !a.horario);
    if (aulasIncompletas) {
      Alert.alert('Atenção', 'Selecione o dia e o horário para todas as aulas da semana.');
      return;
    }

    try {
      setLoadingSalvar(true);
      await api.post('/api/alunos', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        cidade: cidade.trim(),
        professor: professorSelecionado._id,
        aulasSemanais: qtdAulas,
        horariosAula: aulas,
      });

      Alert.alert(
        'Sucesso',
        'Aluno cadastrado com sucesso! A senha inicial foi enviada por e-mail.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao cadastrar aluno.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingSalvar(false);
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
            Dados do Aluno
          </Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">NOME COMPLETO</Text>
              <TextInput
                placeholder="Ex: Maria Silva"
                value={nome}
                onChangeText={setNome}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">E-MAIL</Text>
              <TextInput
                placeholder="maria@muvup.com"
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

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">ENDEREÇO</Text>
              <TextInput
                placeholder="Rua das Flores, 123"
                value={endereco}
                onChangeText={setEndereco}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-1">CIDADE</Text>
              <TextInput
                placeholder="Sorocaba"
                value={cidade}
                onChangeText={setCidade}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-800 bg-white"
              />
            </View>
          </View>

          {/* Seleção do Professor & Frequência */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Plano & Instrutor
          </Text>

          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
            {/* Seletor do Professor */}
            <View>
              <Text className="text-xs font-semibold text-gray-600 mb-1">PROFESSOR RESPONSÁVEL</Text>
              <TouchableOpacity
                onPress={() => setModalProfVisible(true)}
                className="border border-gray-300 rounded-lg px-3 py-3 flex-row justify-between items-center bg-gray-50"
              >
                <Text className={professorSelecionado ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                  {professorSelecionado ? professorSelecionado.nome : 'Selecione um professor...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* Quantidade de Aulas na Semana */}
            <View className="mt-3">
              <Text className="text-xs font-semibold text-gray-600 mb-2">FREQUÊNCIA SEMANAL</Text>
              <View className="flex-row justify-between">
                {[1, 2, 3, 4, 5].map((qtd) => (
                  <TouchableOpacity
                    key={qtd}
                    onPress={() => alterarQuantidadeAulas(qtd)}
                    className={`w-[18%] py-2.5 rounded-lg border items-center justify-center ${qtdAulas === qtd
                        ? 'bg-muv-verde border-muv-verde'
                        : 'bg-white border-gray-200'
                      }`}
                  >
                    <Text className={`font-bold ${qtdAulas === qtd ? 'text-white' : 'text-gray-700'}`}>
                      {qtd}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Configuração de Cada Aula */}
          {professorSelecionado && (
            <>
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Horários das Aulas
              </Text>

              {aulas.map((aula, idx) => {
                const slotsDisponiveis = getSlotsDisponiveis(aula.diaSemana);

                return (
                  <View key={idx} className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                    <Text className="text-xs font-bold text-muv-verde mb-3">
                      AULA {idx + 1}
                    </Text>

                    <View className="flex-row justify-between">
                      {/* Seletor do Dia */}
                      <TouchableOpacity
                        onPress={() => {
                          setIndexAulaEditando(idx);
                          setModalDiaVisible(true);
                        }}
                        className="w-[48%] border border-gray-300 rounded-lg p-2.5 bg-gray-50 flex-row justify-between items-center"
                      >
                        <Text className={aula.diaSemana ? 'text-gray-800 text-xs font-semibold' : 'text-gray-400 text-xs'}>
                          {aula.diaSemana || 'Dia da semana'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#718096" />
                      </TouchableOpacity>

                      {/* Seletor da Hora */}
                      <TouchableOpacity
                        disabled={!aula.diaSemana}
                        onPress={() => {
                          setIndexAulaEditando(idx);
                          setModalHoraVisible(true);
                        }}
                        className={`w-[48%] border rounded-lg p-2.5 flex-row justify-between items-center ${!aula.diaSemana ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gray-50 border-gray-300'
                          }`}
                      >
                        <Text className={aula.horario ? 'text-gray-800 text-xs font-semibold' : 'text-gray-400 text-xs'}>
                          {aula.horario || 'Horário'}
                        </Text>
                        <Ionicons name="time-outline" size={16} color="#718096" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleCadastrar}
            disabled={loadingSalvar}
            className={`w-full py-4 mt-4 rounded-xl items-center justify-center ${loadingSalvar ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-90'
              }`}
          >
            {loadingSalvar ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">Cadastrar Aluno</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL: SELEÇÃO DE PROFESSOR */}
      <Modal visible={modalProfVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-xl p-5">
            <Text className="text-base font-bold text-gray-800 mb-3">Escolha o Professor</Text>
            {carregandoProfessores ? (
              <ActivityIndicator color="#63B887" />
            ) : (
              professores.map((prof) => (
                <TouchableOpacity
                  key={prof._id}
                  onPress={() => {
                    setProfessorSelecionado(prof);
                    setAulas(aulas.map(() => ({ diaSemana: '', horario: '' })));
                    setModalProfVisible(false);
                  }}
                  className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                >
                  <Text className="text-sm font-medium text-gray-700">{prof.nome}</Text>
                  {professorSelecionado?._id === prof._id && (
                    <Ionicons name="checkmark" size={18} color="#63B887" />
                  )}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setModalProfVisible(false)} className="mt-4 items-center">
              <Text className="text-gray-500 font-semibold text-xs">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SELEÇÃO DE DIA DA SEMANA */}
      <Modal visible={modalDiaVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-xl p-5">
            <Text className="text-base font-bold text-gray-800 mb-3">Dias Disponíveis</Text>
            {professorSelecionado?.horarios?.map((h) => (
              <TouchableOpacity
                key={h.diaSemana}
                onPress={() => {
                  atualizarAula(indexAulaEditando, 'diaSemana', h.diaSemana);
                  setModalDiaVisible(false);
                }}
                className="py-3 border-b border-gray-100 flex-row justify-between items-center"
              >
                <Text className="text-sm font-medium text-gray-700">{h.diaSemana}</Text>
                <Text className="text-xs text-muv-verde">{h.slots.length} horários</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setModalDiaVisible(false)} className="mt-4 items-center">
              <Text className="text-gray-500 font-semibold text-xs">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SELEÇÃO DE HORÁRIO */}
      <Modal visible={modalHoraVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-xl p-5">
            <Text className="text-base font-bold text-gray-800 mb-3">Horários Disponíveis</Text>
            <View className="flex-row flex-wrap justify-between">
              {getSlotsDisponiveis(aulas[indexAulaEditando]?.diaSemana).map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => {
                    atualizarAula(indexAulaEditando, 'horario', slot);
                    setModalHoraVisible(false);
                  }}
                  className="w-[30%] py-2.5 mb-2 rounded-lg border border-gray-200 items-center justify-center bg-gray-50"
                >
                  <Text className="text-xs font-semibold text-gray-700">{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setModalHoraVisible(false)} className="mt-3 items-center">
              <Text className="text-gray-500 font-semibold text-xs">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}