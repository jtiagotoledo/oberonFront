import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../services/api';

type AbaTipo = 'professores' | 'alunos' | 'admins';

export default function GestaoUsuariosScreen() {
  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('professores');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados individuais para manter em memória ao alternar abas
  const [professores, setProfessores] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  const carregarDadosAba = async (aba: AbaTipo) => {
    try {
      setCarregando(true);
      if (aba === 'professores') {
        const res = await api.get('/api/professores');
        setProfessores(res.data);
      } else if (aba === 'alunos') {
        const res = await api.get('/api/alunos');
        setAlunos(res.data);
      } else if (aba === 'admins') {
        const res = await api.get('/api/admins');
        setAdmins(res.data);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDadosAba(abaAtiva);
    }, [abaAtiva])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarDadosAba(abaAtiva);
  };

  // Retorna os dados da aba atual filtrados pela barra de busca
  const listaAtual = () => {
    let fonte = [];
    if (abaAtiva === 'professores') fonte = professores;
    if (abaAtiva === 'alunos') fonte = alunos;
    if (abaAtiva === 'admins') fonte = admins;

    if (!busca.trim()) return fonte;

    return fonte.filter((item: any) =>
      item.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      item.email?.toLowerCase().includes(busca.toLowerCase())
    );
  };

  // Ação do botão flutuante (+) de acordo com a aba selecionada
  const handleNovoCadastro = () => {
    if (abaAtiva === 'professores') router.push('/(admin)/cadastrar-professor' as any);
    if (abaAtiva === 'alunos') router.push('/(admin)/cadastrar-aluno' as any);
    if (abaAtiva === 'admins') router.push('/(admin)/cadastrar-admin' as any);
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View className="bg-white p-4 rounded-xl border border-gray-200 mb-3 shadow-sm">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-base font-bold text-gray-800 flex-1 mr-2" numberOfLines={1}>
            {item.nome}
          </Text>

          {item.primeiroAcesso && (
            <View className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
              <Text className="text-[10px] font-bold text-amber-700">1º Acesso Pendente</Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-gray-500 mb-2">{item.email}</Text>

        {/* Metadados específicos de cada papel */}
        {abaAtiva === 'professores' && (
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 mt-1">
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={13} color="#718096" />
              <Text className="text-xs text-gray-600 ml-1">{item.telefone || 'Sem telefone'}</Text>
            </View>
            <Text className="text-xs font-semibold text-muv-verde bg-green-50 px-2 py-0.5 rounded border border-green-200">
              {item.horarios?.reduce((acc: number, h: any) => acc + (h.slots?.length || 0), 0) || 0} slots semanais
            </Text>
          </View>
        )}

        {abaAtiva === 'alunos' && (
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 mt-1">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={13} color="#718096" />
              <Text className="text-xs text-gray-600 ml-1">
                Prof: {item.professor?.nome || 'Não atribuído'}
              </Text>
            </View>
            <Text className="text-xs font-semibold text-muv-verde bg-green-50 px-2 py-0.5 rounded border border-green-200">
              {item.aulasSemanais ? `${item.aulasSemanais}x na semana` : 'Sem plano'}
            </Text>
          </View>
        )}

        {abaAtiva === 'admins' && (
          <View className="flex-row items-center pt-2 border-t border-gray-100 mt-1">
            <Ionicons name="shield-outline" size={13} color="#718096" />
            <Text className="text-xs text-gray-600 ml-1">{item.telefone || 'Sem telefone'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
      {/* Barra de Busca */}
      <View className="px-5 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-xl border border-gray-200 mb-3">
          <Ionicons name="search" size={18} color="#718096" />
          <TextInput
            placeholder={`Buscar em ${abaAtiva}...`}
            value={busca}
            onChangeText={setBusca}
            className="flex-1 ml-2 text-sm text-gray-800"
            autoCapitalize="none"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={16} color="#A0AEC0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Seletor Segmentado (Tabs) */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          {(
            [
              { key: 'professores', label: 'Professores' },
              { key: 'alunos', label: 'Alunos' },
              { key: 'admins', label: 'Admins' },
            ] as const
          ).map((aba) => {
            const ativa = abaAtiva === aba.key;
            return (
              <TouchableOpacity
                key={aba.key}
                onPress={() => setAbaAtiva(aba.key)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  ativa ? 'bg-muv-verde shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${ativa ? 'text-white' : 'text-gray-600'}`}
                >
                  {aba.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Lista ou Loading */}
      {carregando && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#63B887" />
        </View>
      ) : (
        <FlatList
          data={listaAtual()}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#63B887']} />}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Ionicons name="file-tray-outline" size={44} color="#CBD5E0" />
              <Text className="text-gray-400 font-medium text-sm mt-2">
                Nenhum usuário encontrado em {abaAtiva}.
              </Text>
            </View>
          }
        />
      )}

      {/* Botão de Adicionar Flutuante (FAB) */}
      <TouchableOpacity
        onPress={handleNovoCadastro}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-muv-verde items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}