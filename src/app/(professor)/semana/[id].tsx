import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';

export default function SemanaDetalhes() {
  const { id } = useLocalSearchParams(); // Parâmetro da rota (ex: '2026-09-07')
  const [agenda, setAgenda] = useState<any[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAgenda();
  }, []);

  const carregarAgenda = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/professores/minha-agenda');
      const dados = res.data.agenda || [];
      setAgenda(dados);
      
      if (dados.length > 0) {
        // Seleciona o primeiro dia que contém horários, ou a segunda-feira por padrão
        const primeiroDiaComAula = dados.find((d: any) => d.horarios.length > 0) || dados[0];
        setDiaSelecionado(primeiroDiaComAula);
      }
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
      {/* Badges de Dias da Semana */}
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
                className={`mr-3 px-5 py-2.5 rounded-full border ${
                  isSelected 
                    ? 'bg-muv-verde border-muv-verde' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {dia.diaNome}
                  </Text>
                  {/* Bolinha indicadora se há aulas no dia (escondida se estiver selecionado para visual mais limpo) */}
                  {temAula && !isSelected && (
                    <View className="w-1.5 h-1.5 rounded-full bg-muv-verde ml-1.5" />
                  )}
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
                  item.alunos.map((aluno: any) => (
                    <View key={aluno.id} className="flex-row items-center py-2">
                      <Ionicons name="person-circle-outline" size={24} color="#A0AEC0" />
                      <Text className="text-gray-700 font-medium text-base ml-2">{aluno.nome}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 italic text-sm py-1 ml-1">Horário vago.</Text>
                )}
                
              </View>
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center mt-10">
            <Ionicons name="cafe-outline" size={48} color="#CBD5E0" />
            <Text className="text-gray-500 text-lg font-bold mt-4">Dia Livre!</Text>
            <Text className="text-gray-400 text-base text-center mt-1">
              Você não possui horários de aula configurados para {diaSelecionado?.diaNome.toLowerCase()}.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}