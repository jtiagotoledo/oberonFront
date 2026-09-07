import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const gerarProximasSemanas = () => {
  const semanas = [];
  let dataAtual = new Date();
  
  const diaDaSemana = dataAtual.getDay();
  const diff = dataAtual.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1);
  dataAtual.setDate(diff);

  for (let i = 0; i < 4; i++) {
    const sexta = new Date(dataAtual);
    sexta.setDate(dataAtual.getDate() + 4);

    const formataData = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const idData = dataAtual.toISOString().split('T')[0];

    semanas.push({
      id: idData,
      titulo: `Semana de ${formataData(dataAtual)} a ${formataData(sexta)}`
    });

    dataAtual.setDate(dataAtual.getDate() + 7);
  }
  return semanas;
};

export default function ProfessorHome() {
  const router = useRouter();
  const semanas = gerarProximasSemanas();

  return (
    <View className="flex-1 bg-gray-50 p-5">
      <Text className="text-xl font-bold text-gray-800 mb-5 mt-2">Próximas Semanas</Text>
      
      <FlatList
        data={semanas}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-200 active:bg-gray-100 flex-row justify-between items-center"
            onPress={() => router.push({ pathname: '/(professor)/semana/[id]', params: { id: item.id } })}
          >
            <View>
              <Text className="text-lg font-bold text-gray-700">{item.titulo}</Text>
              <Text className="text-sm text-gray-400 mt-1">Toque para ver os horários</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}