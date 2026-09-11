import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAPA_DIAS: Record<string, number> = {
  'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 
  'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
};

const DIAS_POR_INDEX_EXATO = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export default function AlunoHome() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [aulasDaSemana, setAulasDaSemana] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Limites: -1 (uma semana para trás) até 4 (quatro semanas para frente)
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [periodoLabel, setPeriodoLabel] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function carregarAulas() {
        try {
          setLoading(true);
          const res = await api.get(`/api/alunos/${user?.id}`);
          if (!isActive) return;

          const aluno = res.data;
          
          const baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + (semanaOffset * 7));
          baseDate.setHours(0, 0, 0, 0);
          
          const domingo = new Date(baseDate);
          domingo.setDate(baseDate.getDate() - baseDate.getDay());
          
          const sabado = new Date(domingo);
          sabado.setDate(domingo.getDate() + 6);
          sabado.setHours(23, 59, 59, 999);

          const fmtIni = `${String(domingo.getDate()).padStart(2, '0')}/${String(domingo.getMonth() + 1).padStart(2, '0')}`;
          const fmtFim = `${String(sabado.getDate()).padStart(2, '0')}/${String(sabado.getMonth() + 1).padStart(2, '0')}`;
          setPeriodoLabel(`${fmtIni} a ${fmtFim}`);

          const formataYMD = (d: Date) => {
            const ano = d.getFullYear();
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const dia = String(d.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
          };

          let listaDeAulas: any[] = [];
          const domingoYMD = formataYMD(domingo);
          const sabadoYMD = formataYMD(sabado);

          // 1. Mapeia as aulas fixas da rotina
          (aluno.horariosAula || []).forEach((aulaFixa: any) => {
            const dataAula = new Date(domingo);
            dataAula.setDate(domingo.getDate() + MAPA_DIAS[aulaFixa.diaSemana]);
            dataAula.setHours(0, 0, 0, 0);

            const dataYMD = formataYMD(dataAula);

            const foiReagendadaOrigem = (aluno.reagendamentos || []).some(
              (r: any) => r.dataOrigem === dataYMD && r.horarioOrigem === aulaFixa.horario
            );

            if (!foiReagendadaOrigem && dataYMD >= domingoYMD && dataYMD <= sabadoYMD) {
              listaDeAulas.push({
                id: `fixa-${dataYMD}-${aulaFixa.horario}`,
                diaSemana: aulaFixa.diaSemana,
                horario: aulaFixa.horario,
                dataCompleta: dataAula,
                dataFormata: `${String(dataAula.getDate()).padStart(2, '0')}/${String(dataAula.getMonth() + 1).padStart(2, '0')}/${dataAula.getFullYear()}`,
                professor: aluno.professor?.nome || 'Professor',
                isReagendada: false
              });
            }
          });

          // 2. Adiciona as aulas vindas de REAGENDAMENTOS
          (aluno.reagendamentos || []).forEach((reag: any) => {
            if (reag.dataNova >= domingoYMD && reag.dataNova <= sabadoYMD) {
              const [ano, mes, dia] = reag.dataNova.split('-').map(Number);
              const dataNovaObj = new Date(ano, mes - 1, dia);
              const indexDia = dataNovaObj.getDay();
              const nomeDiaSemana = DIAS_POR_INDEX_EXATO[indexDia];

              let nomeProf = aluno.professor?.nome;
              if (reag.professor) {
                if (typeof reag.professor === 'object' && reag.professor.nome) {
                  nomeProf = reag.professor.nome;
                }
              }

              listaDeAulas.push({
                id: `reag-${reag._id || reag.dataNova}`,
                diaSemana: nomeDiaSemana,
                horario: reag.horarioNovo,
                dataCompleta: dataNovaObj,
                dataFormata: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`,
                professor: nomeProf || 'Professor',
                isReagendada: true
              });
            }
          });

          listaDeAulas.sort((a, b) => a.dataCompleta.getTime() - b.dataCompleta.getTime());
          setAulasDaSemana(listaDeAulas);
        } catch (error) {
          console.warn("Erro ao carregar aulas do aluno", error);
        } finally {
          if (isActive) setLoading(false);
        }
      }
      
      carregarAulas();

      return () => {
        isActive = false;
      };
    }, [user?.id, semanaOffset])
  );

  if (loading && aulasDaSemana.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#8C6E97" />
      </View>
    );
  }

  const podeVoltar = semanaOffset > -1;
  const podeAvancar = semanaOffset < 4;

  return (
    <View 
      className="flex-1 bg-gray-50 px-5 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      {/* Barra de Navegação de Semanas com Limites */}
      <View className="flex-row items-center justify-between bg-white p-3 rounded-2xl mb-4 shadow-sm border border-gray-200">
        <TouchableOpacity 
          disabled={!podeVoltar}
          onPress={() => setSemanaOffset(prev => prev - 1)}
          className={`p-2 rounded-xl ${podeVoltar ? 'bg-gray-50' : 'bg-gray-100 opacity-40'}`}
        >
          <Ionicons name="chevron-back" size={20} color="#4A5568" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-xs text-gray-400 font-semibold uppercase">Semana Selecionada</Text>
          <Text className="text-base font-bold text-gray-800">{periodoLabel}</Text>
        </View>

        <TouchableOpacity 
          disabled={!podeAvancar}
          onPress={() => setSemanaOffset(prev => prev + 1)}
          className={`p-2 rounded-xl ${podeAvancar ? 'bg-gray-50' : 'bg-gray-100 opacity-40'}`}
        >
          <Ionicons name="chevron-forward" size={20} color="#4A5568" />
        </TouchableOpacity>
      </View>

      <Text className="text-xl font-bold text-gray-800 mb-4">Suas aulas no período</Text>
      
      <FlatList
        data={aulasDaSemana}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className={`bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-200 border-l-4 ${item.isReagendada ? 'border-l-muv-teal' : 'border-l-muv-roxo'}`}>
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-gray-800">{item.diaSemana}</Text>
                {item.isReagendada && (
                  <View className="ml-2 bg-muv-teal/10 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-muv-teal uppercase">Reagendada</Text>
                  </View>
                )}
              </View>
              <View className="bg-muv-roxo/10 px-3 py-1 rounded-md">
                <Text className="text-muv-roxo font-bold">{item.horario}</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="calendar-outline" size={16} color="#718096" />
              <Text className="text-gray-500 ml-2">{item.dataFormata}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={16} color="#718096" />
              <Text className="text-gray-500 ml-2">Com {item.professor}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-gray-400">Nenhuma aula agendada neste período.</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        onPress={() => router.push('/(aluno)/reagendar')}
        className="bg-muv-roxo py-4 rounded-xl items-center mt-2 shadow-sm"
      >
        <Text className="text-white font-bold text-base">Reagendar uma Aula</Text>
      </TouchableOpacity>
    </View>
  );
}