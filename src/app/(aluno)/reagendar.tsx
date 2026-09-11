import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';

const DIAS_SEMANA_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const MAPA_DIAS: Record<string, number> = {
  'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 
  'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
};

const DIAS_POR_INDEX = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export default function ReagendarScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Listas de Dados
  const [minhasAulas, setMinhasAulas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [ocupacaoCompleta, setOcupacaoCompleta] = useState<any[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<any[]>([]);
  
  // Controles de Seleção
  const [aulaOrigem, setAulaOrigem] = useState<any>(null);
  const [professorSel, setProfessorSel] = useState<any>(null);
  
  // Controles de Calendário
  const [mesVisualizado, setMesVisualizado] = useState<Date>(new Date());
  const [dataNova, setDataNova] = useState<Date>(new Date());
  const [horarioNovo, setHorarioNovo] = useState<any>(null);

  // Modais
  const [modalAulas, setModalAulas] = useState(false);
  const [modalProfs, setModalProfs] = useState(false);
  const [modalHoras, setModalHoras] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  const carregarBase = async () => {
    try {
      setLoading(true);
      const [resAluno, resProfs] = await Promise.all([
        api.get(`/api/alunos/${user?.id}`),
        api.get('/api/professores')
      ]);
      
      const horariosFixos = resAluno.data.horariosAula || [];
      gerarAulasFuturas(horariosFixos);
      
      setProfessores(resProfs.data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados iniciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarBase();
  }, []);

  const gerarAulasFuturas = (horariosFixos: any[]) => {
    const aulasProjetadas: any[] = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const domingoDaSemana = new Date(hoje);
      domingoDaSemana.setDate(hoje.getDate() - hoje.getDay() + (i * 7));

      horariosFixos.forEach((hf) => {
        const dataAula = new Date(domingoDaSemana);
        dataAula.setDate(domingoDaSemana.getDate() + MAPA_DIAS[hf.diaSemana]);
        dataAula.setHours(0, 0, 0, 0);

        // Regra 1: Mostrar apenas aulas futuras (estritamente maior que hoje)
        if (dataAula > hoje) {
          aulasProjetadas.push({
            ...hf,
            dataCompleta: dataAula,
            dataLabel: `${String(dataAula.getDate()).padStart(2, '0')}/${String(dataAula.getMonth() + 1).padStart(2, '0')}`
          });
        }
      });
    }

    aulasProjetadas.sort((a: any, b: any) => a.dataCompleta.getTime() - b.dataCompleta.getTime());
    setMinhasAulas(aulasProjetadas.slice(0, 8)); 
  };

  useEffect(() => {
    if (professorSel) {
      buscarOcupacaoProfessor(professorSel._id);
    } else {
      setOcupacaoCompleta([]);
      setHorariosDisponiveis([]);
    }
  }, [professorSel]);

  useEffect(() => {
    if (professorSel && dataNova) {
      filtrarHorariosPorData(dataNova, ocupacaoCompleta);
    }
  }, [dataNova, ocupacaoCompleta, professorSel]);

  const buscarOcupacaoProfessor = async (profId: string) => {
    try {
      setLoadingHorarios(true);
      const res = await api.get(`/api/professores/${profId}/ocupacao`);
      setOcupacaoCompleta(res.data.ocupacao || []);
    } catch (error) {
      console.warn('Erro ao buscar ocupação', error);
      setOcupacaoCompleta([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const filtrarHorariosPorData = (dataSelecionada: Date, ocupacaoGeral: any[]) => {
    const diaTexto = DIAS_POR_INDEX[dataSelecionada.getDay()];
    const diaEncontrado = ocupacaoGeral.find((d: any) => d.diaSemana === diaTexto);
    
    if (diaEncontrado && diaEncontrado.slots) {
      const livres = diaEncontrado.slots.filter((s: any) => !s.lotado);
      setHorariosDisponiveis(livres);
    } else {
      setHorariosDisponiveis([]);
    }
    setHorarioNovo(null); 
  };

  const limparEstados = () => {
    setAulaOrigem(null);
    setProfessorSel(null);
    setHorarioNovo(null);
    setDataNova(new Date());
    setMesVisualizado(new Date());
  };

  const handleConfirmar = async () => {
    if (!aulaOrigem || !professorSel || !dataNova || !horarioNovo) {
      Alert.alert('Atenção', 'Preencha todos os campos para reagendar.');
      return;
    }
    
    try {
      setLoadingSalvar(true);
      
      // Função auxiliar para formatar a data no padrão YYYY-MM-DD sem problema de fuso horário
      const formataYMD = (d: Date) => {
        const dataAjustada = new Date(d);
        dataAjustada.setMinutes(dataAjustada.getMinutes() - dataAjustada.getTimezoneOffset());
        return dataAjustada.toISOString().split('T')[0];
      };

      const dataOrigemFormatada = formataYMD(aulaOrigem.dataCompleta);
      const dataNovaFormatada = formataYMD(dataNova);

      // Chama a nova rota de reagendamento pontual
      await api.post(`/api/alunos/${user?.id}/reagendar`, {
        dataOrigem: dataOrigemFormatada,
        horarioOrigem: aulaOrigem.horario,
        dataNova: dataNovaFormatada,
        horarioNovo: horarioNovo.horario,
        professor: professorSel._id
      });

      Alert.alert(
        'Sucesso', 
        `Sua aula foi reagendada para ${dataNova.toLocaleDateString('pt-BR')} às ${horarioNovo.horario} com ${professorSel.nome}.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              limparEstados();
              carregarBase(); 
            } 
          }
        ]
      );
    } catch (error: any) {
      const msg = error.response?.data?.erro || 'Erro ao reagendar aula.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingSalvar(false);
    }
  };

  const mudarMes = (direcao: number) => {
    setMesVisualizado(new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth() + direcao, 1));
  };

  const renderCalendario = () => {
    const ano = mesVisualizado.getFullYear();
    const mes = mesVisualizado.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const primeiroDiaIndex = new Date(ano, mes, 1).getDay();
    
    const diasArray = Array(primeiroDiaIndex).fill(null).concat(Array.from({length: diasNoMes}, (_, i) => i + 1));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return (
      <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-full max-w-[340px] self-center mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => mudarMes(-1)} className="p-2">
            <Ionicons name="chevron-back" size={20} color="#718096" />
          </TouchableOpacity>
          <Text className="font-bold text-gray-700 text-base capitalize">
            {mesVisualizado.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => mudarMes(1)} className="p-2">
            <Ionicons name="chevron-forward" size={20} color="#718096" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-2">
          {DIAS_SEMANA_ABREV.map((dia) => (
            <Text key={dia} className={`text-xs font-bold w-10 text-center ${dia === 'DOM' ? 'text-red-500' : 'text-gray-500'}`}>
              {dia}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {diasArray.map((dia, index) => {
            if (!dia) return <View key={index} className="w-10 h-10 m-0.5" />;

            const dataAtualCalendario = new Date(ano, mes, dia);
            dataAtualCalendario.setHours(0, 0, 0, 0);

            const isToday = dataAtualCalendario.getTime() === hoje.getTime();
            const isSelected = dataNova && dataAtualCalendario.getTime() === dataNova.getTime();
            
            // Regra 2: Bloquear datas passadas e menores/iguais à data de origem
            let isDisabled = false;
            if (aulaOrigem) {
              isDisabled = dataAtualCalendario <= aulaOrigem.dataCompleta;
            } else {
              isDisabled = dataAtualCalendario <= hoje;
            }

            return (
              <TouchableOpacity
                key={index}
                disabled={isDisabled}
                onPress={() => setDataNova(dataAtualCalendario)}
                className={`w-10 h-10 m-0.5 items-center justify-center rounded-xl ${
                  isSelected 
                    ? 'bg-muv-roxo' 
                    : isDisabled 
                      ? 'bg-gray-50' 
                      : isToday 
                        ? 'bg-muv-amarelo/80' 
                        : 'bg-transparent'
                }`}
              >
                <Text className={`text-sm ${
                  isDisabled 
                    ? 'text-gray-300' 
                    : isSelected 
                      ? 'text-white font-bold' 
                      : isToday 
                        ? 'text-gray-800 font-bold' 
                        : 'text-gray-600'
                }`}>
                  {dia}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator color="#8C6E97" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      <Text className="text-gray-800 font-bold text-xl mb-4">Qual aula deseja reagendar?</Text>

      <TouchableOpacity 
        className="bg-white border border-gray-200 px-4 py-4 rounded-xl mb-4 flex-row justify-between items-center shadow-sm"
        onPress={() => setModalAulas(true)}
      >
        <Text className={aulaOrigem ? 'text-gray-800 text-base font-medium' : 'text-gray-400 text-base'}>
          {aulaOrigem ? `${aulaOrigem.dataLabel} (${aulaOrigem.diaSemana.split('-')[0]}) às ${aulaOrigem.horario}` : 'Selecione a aula de origem'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#718096" />
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-white border border-gray-200 px-4 py-4 rounded-xl mb-6 flex-row justify-between items-center shadow-sm"
        onPress={() => setModalProfs(true)}
      >
        <Text className={professorSel ? 'text-gray-800 text-base font-medium' : 'text-gray-400 text-base'}>
          {professorSel ? professorSel.nome : 'Selecione o Professor'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#718096" />
      </TouchableOpacity>

      <Text className="text-gray-800 font-bold text-xl mb-4">Escolha a nova data e horário:</Text>

      {renderCalendario()}

      <TouchableOpacity 
        className={`px-4 py-4 rounded-xl mb-8 flex-row justify-between items-center shadow-sm border ${
          horarioNovo ? 'bg-muv-roxo border-muv-roxo' : 'bg-white border-gray-200'
        }`}
        onPress={() => {
          if (!professorSel) Alert.alert('Atenção', 'Selecione um professor para carregar os horários.');
          else setModalHoras(true);
        }}
      >
        <Text className={`text-base font-medium ${horarioNovo ? 'text-white' : 'text-gray-400'}`}>
          {horarioNovo ? `${horarioNovo.horario}h selecionado` : 'Toque para escolher o horário...'}
        </Text>
        <Ionicons name="time-outline" size={22} color={horarioNovo ? "white" : "#718096"} />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleConfirmar}
        disabled={loadingSalvar}
        className={`py-4 rounded-xl items-center shadow-sm ${loadingSalvar ? 'bg-muv-verde/70' : 'bg-muv-verde active:opacity-80'}`}
      >
        {loadingSalvar ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Confirmar Reagendamento</Text>
        )}
      </TouchableOpacity>

      {/* MODAL: SELECIONAR AULA ORIGEM */}
      <Modal visible={modalAulas} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="font-bold text-lg mb-2 text-gray-800 text-center">Aulas Agendadas</Text>
            <Text className="text-xs text-gray-500 text-center mb-4">Escolha qual aula você vai desmarcar</Text>
            
            {minhasAulas.length === 0 && <Text className="text-center text-gray-500 my-4">Nenhuma aula programada.</Text>}
            
            {minhasAulas.map((aula: any, idx: number) => (
              <TouchableOpacity 
                key={idx} 
                className="py-3.5 border-b border-gray-100 flex-row justify-between items-center" 
                onPress={() => { 
                  setAulaOrigem(aula); 
                  setModalAulas(false);
                  
                  // Se a data Nova atual ficar inválida com a nova aula de origem, joga para o dia seguinte
                  if (dataNova <= aula.dataCompleta) {
                    const diaSeguinte = new Date(aula.dataCompleta);
                    diaSeguinte.setDate(diaSeguinte.getDate() + 1);
                    setDataNova(diaSeguinte);
                    setMesVisualizado(new Date(diaSeguinte.getFullYear(), diaSeguinte.getMonth(), 1));
                    setHorarioNovo(null);
                  }
                }}
              >
                <View className="flex-row items-center">
                  <View className="bg-muv-roxo/10 px-2 py-1 rounded">
                    <Text className="text-muv-roxo font-bold text-xs">{aula.dataLabel}</Text>
                  </View>
                  <Text className="text-gray-700 text-base font-medium ml-3">{aula.diaSemana.split('-')[0]}</Text>
                </View>
                <Text className="text-gray-500 font-bold">{aula.horario}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="py-4 mt-2 bg-gray-100 rounded-xl" onPress={() => setModalAulas(false)}>
              <Text className="text-center text-gray-600 font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SELECIONAR PROFESSOR */}
      <Modal visible={modalProfs} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="font-bold text-lg mb-4 text-gray-800 text-center">Escolha o Instrutor</Text>
            {professores.map((prof: any) => (
              <TouchableOpacity 
                key={prof._id} 
                className="py-3.5 border-b border-gray-100" 
                onPress={() => { setProfessorSel(prof); setModalProfs(false); }}
              >
                <Text className="text-center text-gray-700 text-base font-medium">{prof.nome}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="py-4 mt-4 bg-gray-100 rounded-xl" onPress={() => setModalProfs(false)}>
              <Text className="text-center text-gray-600 font-bold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: HORÁRIOS LIVRES */}
      <Modal visible={modalHoras} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="font-bold text-lg mb-4 text-gray-800 text-center">Horários Livres</Text>
            
            {loadingHorarios ? (
              <ActivityIndicator color="#8C6E97" className="my-4" />
            ) : horariosDisponiveis.length === 0 ? (
              <Text className="text-center text-gray-500 my-4">Não há vagas disponíveis neste dia.</Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {horariosDisponiveis.map((h: any, idx: number) => (
                  <TouchableOpacity 
                    key={idx} 
                    className="w-[48%] py-3 border border-gray-200 rounded-xl mb-3 items-center bg-gray-50 active:bg-gray-100" 
                    onPress={() => { setHorarioNovo(h); setModalHoras(false); }}
                  >
                    <Text className="text-base font-bold text-muv-roxo">{h.horario}</Text>
                    <Text className="text-[10px] text-gray-500 uppercase mt-1">{h.limite - h.matriculados} vagas</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity className="py-3.5 mt-2 bg-gray-100 rounded-xl" onPress={() => setModalHoras(false)}>
              <Text className="text-center text-gray-600 font-bold">Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}