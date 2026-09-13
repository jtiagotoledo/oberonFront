import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';

const MAPA_DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function SemanaDetalhes() {
  const { id } = useLocalSearchParams(); 
  const user = useAuthStore((s) => s.user);

  const [agenda, setAgenda] = useState<any[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAgendaDaSemana();
  }, [id]);

  const carregarAgendaDaSemana = async () => {
    try {
      setLoading(true);
      
      const idStr = Array.isArray(id) ? id[0] : id;
      if (!idStr) return;

      // 1. Constrói os dias da semana selecionada (Segunda a Sexta)
      const [ano, mes, dia] = idStr.split('-').map(Number);
      const dataBase = new Date(ano, mes - 1, dia, 12, 0, 0); // Meio-dia para evitar bug de fuso horário
      
      const diasDaSemana: any[] = [];
      
      // Laço alterado para ir até 5 (Segunda a Sexta)
      for (let i = 0; i < 5; i++) { 
        const dateObj = new Date(dataBase);
        dateObj.setDate(dataBase.getDate() + i);

        const formataYMD = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dd}`;
        };

        diasDaSemana.push({
          diaOriginal: formataYMD(dateObj),
          diaNome: MAPA_DIAS[dateObj.getDay()],
          dataLabel: `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`,
          horariosObj: {} // Objeto temporário para agrupar os alunos por hora
        });
      }

      // 2. Busca os alunos do professor
      const res = await api.get(`/api/professores/${user?.id}/alunos`).catch(async () => {
        const fallbackRes = await api.get('/api/alunos');
        return { data: fallbackRes.data.filter((a: any) => a.professor?._id === user?.id || a.professor === user?.id) };
      });
      
      const alunos = res.data || [];

      // 3. Distribui os alunos nos dias corretos cruzando com os reagendamentos
      alunos.forEach((aluno: any) => {
        (aluno.horariosAula || []).forEach((aula: any) => {
          const diaNaSemana = diasDaSemana.find(d => d.diaNome === aula.diaSemana);
          if (diaNaSemana) {
            const foiReagendada = (aluno.reagendamentos || []).some(
              (r: any) => r.dataOrigem === diaNaSemana.diaOriginal && r.horarioOrigem === aula.horario
            );
            
            if (!foiReagendada) {
              if (!diaNaSemana.horariosObj[aula.horario]) diaNaSemana.horariosObj[aula.horario] = [];
              diaNaSemana.horariosObj[aula.horario].push({
                id: aluno._id,
                nome: aluno.nome,
                telefone: aluno.telefone,
                isReagendada: false
              });
            }
          }
        });

        (aluno.reagendamentos || []).forEach((reag: any) => {
          const diaDestino = diasDaSemana.find(d => d.diaOriginal === reag.dataNova);
          if (diaDestino) {
            if (!diaDestino.horariosObj[reag.horarioNovo]) diaDestino.horariosObj[reag.horarioNovo] = [];
            diaDestino.horariosObj[reag.horarioNovo].push({
              id: `${aluno._id}-reag`,
              nome: aluno.nome,
              telefone: aluno.telefone,
              isReagendada: true
            });
          }
        });
      });

      // 4. Formata o objeto temporário em um array ordenado para a FlatList
      const agendaMapeada = diasDaSemana.map(dia => {
        const horariosArray = Object.keys(dia.horariosObj)
          .sort() 
          .map(hora => ({
            id: hora,
            hora: hora,
            alunos: dia.horariosObj[hora]
          }));

        return {
          ...dia,
          horarios: horariosArray
        };
      });

      setAgenda(agendaMapeada);
      
      const hojeYMD = new Date().toISOString().split('T')[0];
      const diaDeHoje = agendaMapeada.find(d => d.diaOriginal === hojeYMD);
      const primeiroDiaComAula = agendaMapeada.find(d => d.horarios.length > 0) || agendaMapeada[0];
      
      setDiaSelecionado(diaDeHoje || primeiroDiaComAula);

    } catch (error) {
      console.warn("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#63B887" />
        <Text className="text-gray-500 mt-3 font-medium">Carregando horários...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Badges de Dias da Semana com Data */}
      <View className="bg-white pt-4 pb-3 shadow-sm z-10">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {agenda.map((dia) => {
            const isSelected = diaSelecionado?.diaOriginal === dia.diaOriginal;
            const temAula = dia.horarios.length > 0;
            
            return (
              <TouchableOpacity
                key={dia.diaOriginal}
                onPress={() => setDiaSelecionado(dia)}
                className={`mr-3 px-5 py-2 rounded-2xl border ${
                  isSelected 
                    ? 'bg-muv-verde border-muv-verde' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <View className="items-center justify-center">
                  <View className="flex-row items-center">
                    <Text className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {dia.diaNome.split('-')[0]}
                    </Text>
                    {temAula && !isSelected && (
                      <View className="w-1.5 h-1.5 rounded-full bg-muv-verde ml-1.5" />
                    )}
                  </View>
                  <Text className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                    {dia.dataLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Horários e Alunos */}
      <View className="flex-1 p-5">
        {diaSelecionado?.horarios && diaSelecionado.horarios.length > 0 ? (
          <FlatList
            data={diaSelecionado.horarios}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                
                {/* Header do Horário */}
                <View className="flex-row items-center border-b border-gray-100 pb-3 mb-3">
                  <View className="bg-green-50 border border-green-200 px-3 py-1 rounded-md mr-3">
                    <Text className="text-muv-verde font-bold text-lg">{item.hora}</Text>
                  </View>
                  <Text className="text-gray-500 font-medium">
                    {item.alunos.length} {item.alunos.length === 1 ? 'aluno' : 'alunos'}
                  </Text>
                </View>

                {/* Lista de Alunos */}
                {item.alunos.length > 0 ? (
                  item.alunos.map((aluno: any, index: number) => (
                    <View 
                      key={aluno.id} 
                      className={`flex-row items-center py-3 ${
                        index !== item.alunos.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <Ionicons name="person-circle-outline" size={36} color="#CBD5E0" />
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-gray-700 font-bold text-base">{aluno.nome}</Text>
                          {aluno.isReagendada && (
                            <View className="ml-2 bg-muv-teal/15 px-2 py-0.5 rounded border border-muv-teal/30">
                              <Text className="text-[9px] font-bold text-muv-teal uppercase tracking-wider">Reagendada</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Exibição do Telefone */}
                        {aluno.telefone ? (
                          <View className="flex-row items-center mt-0.5">
                            <Ionicons name="logo-whatsapp" size={14} color="#63B887" />
                            <Text className="text-gray-500 font-medium text-xs ml-1.5">
                              {aluno.telefone}
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-gray-400 text-xs mt-0.5 italic">
                            Sem telefone cadastrado
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 italic text-sm py-2 ml-1">Horário vago.</Text>
                )}
                
              </View>
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center mt-10">
            <Ionicons name="cafe-outline" size={48} color="#CBD5E0" />
            <Text className="text-gray-500 text-lg font-bold mt-4">Dia Livre!</Text>
            <Text className="text-gray-400 text-base text-center mt-1 px-4">
              Você não possui alunos agendados para {diaSelecionado?.diaNome.toLowerCase()} ({diaSelecionado?.dataLabel}).
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}