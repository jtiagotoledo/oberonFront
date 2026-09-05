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
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

type AbaTipo = 'professores' | 'alunos' | 'admins';

export default function GestaoUsuariosScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const usuarioLogado = useAuthStore((state) => state.user);

  const [abaAtiva, setAbaAtiva] = useState<AbaTipo>('professores');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [professores, setProfessores] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  // Estado do Modal de Detalhes
  const [usuarioDetalhe, setUsuarioDetalhe] = useState<any | null>(null);
  const [modalDetalheVisivel, setModalDetalheVisivel] = useState(false);

  const carregarDadosAba = useCallback(async (aba: AbaTipo, silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
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
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosAba(abaAtiva);
  }, [abaAtiva, carregarDadosAba]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarDadosAba(abaAtiva, true);
    });
    return unsubscribe;
  }, [navigation, abaAtiva, carregarDadosAba]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDadosAba(abaAtiva, true);
  };

  const listaAtual = () => {
    let fonte: any[] = [];
    if (abaAtiva === 'professores') fonte = professores;
    if (abaAtiva === 'alunos') fonte = alunos;
    if (abaAtiva === 'admins') fonte = admins;

    if (!busca.trim()) return fonte;

    return fonte.filter(
      (item: any) =>
        item.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        item.email?.toLowerCase().includes(busca.toLowerCase()) ||
        (item.cpf && item.cpf.includes(busca.replace(/\D/g, '')))
    );
  };

  const handleNovoCadastro = () => {
    if (abaAtiva === 'professores') {
      router.push({ pathname: '/(admin)/cadastrar-professor', params: { id: '' } });
    } else if (abaAtiva === 'alunos') {
      router.push({ pathname: '/(admin)/cadastrar-aluno', params: { id: '' } });
    } else if (abaAtiva === 'admins') {
      router.push({ pathname: '/(admin)/cadastrar-admin', params: { id: '' } });
    }
  };

  const handleEditar = (item: any) => {
    setModalDetalheVisivel(false);
    if (abaAtiva === 'professores') {
      router.push({ pathname: '/(admin)/cadastrar-professor', params: { id: item._id } });
    } else if (abaAtiva === 'alunos') {
      router.push({ pathname: '/(admin)/cadastrar-aluno', params: { id: item._id } });
    } else if (abaAtiva === 'admins') {
      router.push({ pathname: '/(admin)/cadastrar-admin', params: { id: item._id } });
    }
  };

  const handleAbrirDetalhes = (item: any) => {
    setUsuarioDetalhe(item);
    setModalDetalheVisivel(true);
  };

  const handleExcluir = (item: any) => {
    if (abaAtiva === 'admins' && item._id === usuarioLogado?.id) {
      Alert.alert('Ação bloqueada', 'Você não pode excluir sua própria conta de administrador.');
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${item.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              let endpoint = '';
              if (abaAtiva === 'professores') endpoint = `/api/professores/${item._id}`;
              if (abaAtiva === 'alunos') endpoint = `/api/alunos/${item._id}`;
              if (abaAtiva === 'admins') endpoint = `/api/admins/${item._id}`;

              await api.delete(endpoint);
              Alert.alert('Sucesso', 'Registro excluído com sucesso.');
              setModalDetalheVisivel(false);
              carregarDadosAba(abaAtiva, true);
            } catch (error: any) {
              const msg = error.response?.data?.erro || 'Erro ao excluir usuário.';
              Alert.alert('Erro', msg);
            }
          },
        },
      ]
    );
  };

  const formatarCpf = (cpf?: string) => {
    if (!cpf) return 'Não informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const renderItem = ({ item }: { item: any }) => {
    const ehUsuarioLogado = abaAtiva === 'admins' && item._id === usuarioLogado?.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleAbrirDetalhes(item)}
        className="bg-white p-4 rounded-xl border border-gray-200 mb-3 shadow-sm"
      >
        <View className="mb-1">
          <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
            {item.nome}
          </Text>
        </View>

        <Text className="text-xs text-gray-500 mb-2">{item.email}</Text>

        {abaAtiva === 'professores' && (
          <View className="pt-2 border-t border-gray-100 mt-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={13} color="#718096" />
                <Text className="text-xs text-gray-600 ml-1">{item.telefone || 'Sem telefone'}</Text>
              </View>
              <Text className="text-xs font-semibold text-muv-verde bg-green-50 px-2 py-0.5 rounded border border-green-200">
                {item.horarios?.reduce((acc: number, h: any) => acc + (h.slots?.length || 0), 0) || 0} Aulas
              </Text>
            </View>
          </View>
        )}

        {abaAtiva === 'alunos' && (
          <View className="pt-2 border-t border-gray-100 mt-1">
            <View className="flex-row items-center justify-between mb-1">
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

            {item.cpf && (
              <View className="flex-row items-center">
                <Ionicons name="card-outline" size={12} color="#A0AEC0" />
                <Text className="text-[11px] text-gray-400 ml-1">
                  CPF: {formatarCpf(item.cpf)}
                </Text>
              </View>
            )}
          </View>
        )}

        {abaAtiva === 'admins' && (
          <View className="pt-2 border-t border-gray-100 mt-1">
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={13} color="#718096" />
              <Text className="text-xs text-gray-600 ml-1">{item.telefone || 'Sem telefone'}</Text>
            </View>
          </View>
        )}

        <View className="flex-row justify-end items-center pt-3 mt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={() => handleEditar(item)}
            className="flex-row items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 active:bg-gray-100"
          >
            <Ionicons name="pencil-outline" size={14} color="#4A5568" />
            <Text className="text-xs font-semibold text-gray-700 ml-1.5">Editar</Text>
          </TouchableOpacity>

          {!ehUsuarioLogado && (
            <TouchableOpacity
              onPress={() => handleExcluir(item)}
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 active:bg-red-100 ml-2"
            >
              <Ionicons name="trash-outline" size={14} color="#DC2626" />
              <Text className="text-xs font-semibold text-red-600 ml-1.5">Excluir</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const margemInferiorSegura = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
      {/* Barra de Busca */}
      <View className="px-5 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-xl border border-gray-200 mb-3">
          <Ionicons name="search" size={18} color="#718096" />
          <TextInput
            placeholder={`Buscar por nome, e-mail${abaAtiva === 'alunos' ? ' ou CPF' : ''}...`}
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

        {/* Abas */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setAbaAtiva('professores')}
            className={`flex-1 py-2 rounded-lg items-center ${abaAtiva === 'professores' ? 'bg-muv-verde' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-xs font-bold ${abaAtiva === 'professores' ? 'text-white' : 'text-gray-600'
                }`}
            >
              Professores
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAbaAtiva('alunos')}
            className={`flex-1 py-2 rounded-lg items-center ${abaAtiva === 'alunos' ? 'bg-muv-verde' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-xs font-bold ${abaAtiva === 'alunos' ? 'text-white' : 'text-gray-600'
                }`}
            >
              Alunos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAbaAtiva('admins')}
            className={`flex-1 py-2 rounded-lg items-center ${abaAtiva === 'admins' ? 'bg-muv-verde' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-xs font-bold ${abaAtiva === 'admins' ? 'text-white' : 'text-gray-600'
                }`}
            >
              Admins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {carregando && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#63B887" />
        </View>
      ) : (
        <FlatList
          data={listaAtual()}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: margemInferiorSegura + 80,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#63B887']}
            />
          }
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

      {/* Botão Flutuante */}
      <TouchableOpacity
        onPress={handleNovoCadastro}
        activeOpacity={0.85}
        style={{
          bottom: margemInferiorSegura + 16,
        }}
        className="absolute right-6 w-14 h-14 rounded-full bg-muv-verde items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Detalhes Completos */}
      <Modal visible={modalDetalheVisivel} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-white w-full max-h-[85%] rounded-2xl p-5 shadow-2xl">
            {/* Header Modal */}
            <View className="flex-row justify-between items-start pb-3 border-b border-gray-100">
              <View className="flex-1 mr-3">
                <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
                  {usuarioDetalhe?.nome}
                </Text>
                <Text className="text-xs text-gray-500">{usuarioDetalhe?.email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalDetalheVisivel(false)}
                className="p-1 rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#4A5568" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo com Scroll */}
            <ScrollView className="py-3" showsVerticalScrollIndicator={false}>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Informações de Contato e Registro
              </Text>

              <View className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                <View className="flex-row justify-between py-1">
                  <Text className="text-xs text-gray-500 font-semibold">Telefone:</Text>
                  <Text className="text-xs text-gray-800 font-medium">
                    {usuarioDetalhe?.telefone || 'Não informado'}
                  </Text>
                </View>

                {abaAtiva === 'alunos' && (
                  <View className="flex-row justify-between py-1 border-t border-gray-200/50">
                    <Text className="text-xs text-gray-500 font-semibold">CPF:</Text>
                    <Text className="text-xs text-gray-800 font-medium">
                      {formatarCpf(usuarioDetalhe?.cpf)}
                    </Text>
                  </View>
                )}

                {usuarioDetalhe?.endereco && (
                  <View className="flex-row justify-between py-1 border-t border-gray-200/50">
                    <Text className="text-xs text-gray-500 font-semibold">Endereço:</Text>
                    <Text className="text-xs text-gray-800 font-medium">
                      {usuarioDetalhe?.endereco}
                    </Text>
                  </View>
                )}

                {usuarioDetalhe?.cidade && (
                  <View className="flex-row justify-between py-1 border-t border-gray-200/50">
                    <Text className="text-xs text-gray-500 font-semibold">Cidade:</Text>
                    <Text className="text-xs text-gray-800 font-medium">
                      {usuarioDetalhe?.cidade}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between py-1 border-t border-gray-200/50">
                  <Text className="text-xs text-gray-500 font-semibold">Status Acesso:</Text>
                  <Text
                    className={`text-xs font-bold ${usuarioDetalhe?.primeiroAcesso ? 'text-amber-600' : 'text-muv-verde'
                      }`}
                  >
                    {usuarioDetalhe?.primeiroAcesso ? '1º Acesso Pendente' : 'Ativo'}
                  </Text>
                </View>
              </View>

              {/* Informações Específicas do Aluno */}
              {abaAtiva === 'alunos' && (
                <>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Plano e Instrutor
                  </Text>
                  <View className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                    <View className="flex-row justify-between py-1">
                      <Text className="text-xs text-gray-500 font-semibold">Professor:</Text>
                      <Text className="text-xs text-gray-800 font-bold">
                        {usuarioDetalhe?.professor?.nome || 'Não atribuído'}
                      </Text>
                    </View>
                    <View className="flex-row justify-between py-1 border-t border-gray-200/50">
                      <Text className="text-xs text-gray-500 font-semibold">Aulas Semanais:</Text>
                      <Text className="text-xs text-gray-800 font-bold">
                        {usuarioDetalhe?.aulasSemanais ? `${usuarioDetalhe.aulasSemanais}x na semana` : 'Não definido'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Aulas Agendadas
                  </Text>
                  {usuarioDetalhe?.horariosAula?.length > 0 ? (
                    usuarioDetalhe.horariosAula.map((aula: any, idx: number) => (
                      <View
                        key={idx}
                        className="flex-row justify-between items-center bg-green-50 border border-green-200 rounded-xl p-3 mb-2"
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={14} color="#63B887" />
                          <Text className="text-xs font-bold text-gray-700 ml-2">
                            {aula.diaSemana}
                          </Text>
                        </View>
                        <Text className="text-xs font-bold text-muv-verde">{aula.horario}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 italic mb-3">Nenhum horário registrado.</Text>
                  )}
                </>
              )}

              {/* Informações Específicas do Professor */}
              {abaAtiva === 'professores' && (
                <>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Grade de Atendimento
                  </Text>
                  {usuarioDetalhe?.horarios?.length > 0 ? (
                    usuarioDetalhe.horarios.map((h: any, idx: number) => (
                      <View key={idx} className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                        <Text className="text-xs font-bold text-gray-700 mb-2">{h.diaSemana}</Text>
                        <View className="flex-row flex-wrap">
                          {h.slots?.map((slot: string, sIdx: number) => (
                            <View
                              key={sIdx}
                              className="bg-green-50 border border-green-200 px-2.5 py-1 rounded-md mr-1.5 mb-1.5"
                            >
                              <Text className="text-[11px] font-bold text-muv-verde">{slot}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text className="text-xs text-gray-400 italic mb-3">Nenhum horário cadastrado.</Text>
                  )}
                </>
              )}
            </ScrollView>

            {/* Rodapé do Modal */}
            <View className="flex-row justify-end items-center pt-3 border-t border-gray-100 mt-2">
              <TouchableOpacity
                onPress={() => handleEditar(usuarioDetalhe)}
                className="flex-row items-center px-4 py-2.5 rounded-xl bg-muv-verde active:opacity-90 mr-2"
              >
                <Ionicons name="pencil-outline" size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white ml-1.5">Editar Dados</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalDetalheVisivel(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 active:bg-gray-200"
              >
                <Text className="text-xs font-bold text-gray-600">Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}