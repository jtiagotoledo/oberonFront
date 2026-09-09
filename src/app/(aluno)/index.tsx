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

export default function AlunoHome() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [aulasDaSemana, setAulasDaSemana] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function carregarAulas() {
        try {
          setLoading(true);
          const res = await api.get(`/api/alunos/${user?.id}`);
          if (!isActive) return;

          const aluno = res.data;
          
          const hoje = new Date();
          const domingo = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
          
          const agendaMapeada = (aluno.horariosAula || []).map((aula: any) => {
            const dataAula = new Date(domingo);
            dataAula.setDate(domingo.getDate() + MAPA_DIAS[aula.diaSemana]);
            
            return {
              id: `${aula.diaSemana}-${aula.horario}`,
              diaSemana: aula.diaSemana,
              horario: aula.horario,
              dataFormata: `${String(dataAula.getDate()).padStart(2, '0')}/${String(dataAula.getMonth() + 1).padStart(2, '0')}/${dataAula.getFullYear()}`,
              professor: aluno.professor?.nome || 'Professor',
            };
          });

          agendaMapeada.sort((a: any, b: any) => MAPA_DIAS[a.diaSemana] - MAPA_DIAS[b.diaSemana]);
          setAulasDaSemana(agendaMapeada);
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
    }, [user?.id])
  );

  if (loading && aulasDaSemana.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#8C6E97" />
      </View>
    );
  }

  return (
    <View 
      className="flex-1 bg-gray-50 px-5 pt-5"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <Text className="text-xl font-bold text-gray-800 mb-5 mt-2">Suas aulas nesta semana</Text>
      
      <FlatList
        data={aulasDaSemana}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-200 border-l-4 border-l-muv-roxo">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-gray-800">{item.diaSemana}</Text>
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
            <Text className="text-gray-400">Nenhuma aula agendada.</Text>
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