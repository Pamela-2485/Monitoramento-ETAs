import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Search,
  Radio,
  FileSpreadsheet,
  Droplets,
  Clock3,
  Gauge,
  TrendingDown
} from 'lucide-react'

import * as XLSX from 'xlsx'

import { supabase } from '../../lib/supabase'

import './HistoricoMonitoramento.css'


function HistoricoMonitoramento() {

  const navigate = useNavigate()


  // =========================
  // ETAs E PRODUTOS
  // DO SUPABASE
  // =========================

  const [etas, setEtas] =
    useState([])

  const [produtos, setProdutos] =
    useState([])

  const [
    carregandoCadastros,
    setCarregandoCadastros
  ] = useState(true)


  // =========================
  // FILTROS
  // =========================

  const [dataInicial, setDataInicial] =
    useState('')

  const [dataFinal, setDataFinal] =
    useState('')

  const [etaFiltro, setEtaFiltro] =
    useState('todas')

  const [produtoFiltro, setProdutoFiltro] =
    useState('todos')

  const [pesquisou, setPesquisou] =
    useState(false)


  // =========================
  // DADOS DO SUPABASE
  // =========================

  const [
    monitoramento,
    setMonitoramento
  ] = useState([])

  const [
    carregandoMonitoramento,
    setCarregandoMonitoramento
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


  // =========================
  // CARREGAR ETAs E PRODUTOS
  // =========================

  useEffect(() => {

    async function carregarCadastros() {

      setCarregandoCadastros(true)


      try {

        const [
          respostaEtas,
          respostaProdutos
        ] = await Promise.all([

          supabase
            .from('etas')
            .select(`
              id,
              nome,
              slug,

              reservatorios (
                id,
                ativo,

                produtos (
                  id,
                  nome,
                  slug
                )
              )
            `)
            .order(
              'nome',
              {
                ascending: true
              }
            ),

          supabase
            .from('produtos')
            .select(`
              id,
              nome,
              slug
            `)
            .order(
              'nome',
              {
                ascending: true
              }
            )

        ])


        if (respostaEtas.error) {

          console.error(
            'Erro ao carregar ETAs:',
            respostaEtas.error
          )

          return

        }


        if (respostaProdutos.error) {

          console.error(
            'Erro ao carregar produtos:',
            respostaProdutos.error
          )

          return

        }


        const produtosFormatados =
          (respostaProdutos.data || [])
            .map(
              (produto) => ({

                id:
                  converterProdutoSlugParaLocal(
                    produto.slug
                  ),

                bancoId:
                  produto.id,

                nome:
                  produto.nome,

                slug:
                  produto.slug

              })
            )


        const etasFormatadas =
          (respostaEtas.data || [])
            .map(
              (eta) => {

                const produtosEta =
                  new Map()


                ;(eta.reservatorios || [])
                  .filter(
                    (reservatorio) =>
                      reservatorio.ativo
                  )
                  .forEach(
                    (reservatorio) => {

                      const produto =
                        reservatorio.produtos


                      if (!produto) {
                        return
                      }


                      produtosEta.set(
                        produto.id,
                        {

                          id:
                            converterProdutoSlugParaLocal(
                              produto.slug
                            ),

                          bancoId:
                            produto.id,

                          nome:
                            produto.nome,

                          slug:
                            produto.slug

                        }
                      )

                    }
                  )


                return {

                  id:
                    eta.slug,

                  bancoId:
                    eta.id,

                  nome:
                    eta.nome,

                  produtos:
                    Array.from(
                      produtosEta.values()
                    )

                }

              }
            )


        setProdutos(
          produtosFormatados
        )

        setEtas(
          etasFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar ETAs e produtos:',
          erro
        )

      } finally {

        setCarregandoCadastros(false)

      }

    }


    carregarCadastros()

  }, [])


  // =========================
  // CARREGAR MONITORAMENTO
  // =========================

  async function carregarMonitoramento() {
      setCarregandoMonitoramento(true)
      setErroCarregamento('')


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('leituras_reservatorios')
            .select(`
              id,
              volume_l,
              percentual,
              esp32_status,
              data_leitura,

              reservatorios (
                id,
                nome,
                capacidade_l,

                etas (
                  slug,
                  nome
                ),

                produtos (
                  slug,
                  nome
                )
              )
            `)
            .order(
              'data_leitura',
              {
                ascending: true
              }
            )


        if (error) {

          console.error(
            'Erro ao carregar monitoramento:',
            error
          )

          setErroCarregamento(
            'Não foi possível carregar o histórico de monitoramento.'
          )

          return false

        }


        const ultimoVolumePorReservatorio =
          new Map()


        const registros =
          (data || []).map(
            (registro) => {

              const reservatorio =
                registro.reservatorios

              const reservatorioId =
                reservatorio?.id

              const volumeAtual =
                Number(
                  registro.volume_l
                )

              const volumeAnterior =
                ultimoVolumePorReservatorio
                  .has(reservatorioId)
                  ? ultimoVolumePorReservatorio
                      .get(reservatorioId)
                  : volumeAtual


              ultimoVolumePorReservatorio.set(
                reservatorioId,
                volumeAtual
              )


              const dataHora =
                new Date(
                  registro.data_leitura
                )


              const dataRegistro =
                dataHora
                  .toLocaleDateString(
                    'sv-SE'
                  )


              const horaRegistro =
                dataHora
                  .toLocaleTimeString(
                    'pt-BR',
                    {
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )


              return {

                id:
                  registro.id,

                reservatorioId:
                  reservatorioId || '',

                dataHoraOriginal:
                  registro.data_leitura,

                data:
                  dataRegistro,

                hora:
                  horaRegistro,

                etaId:
                  reservatorio
                    ?.etas
                    ?.slug || '',

                etaNome:
                  reservatorio
                    ?.etas
                    ?.nome || '-',

                produtoId:
                  converterProdutoSlugParaLocal(
                    reservatorio
                      ?.produtos
                      ?.slug
                  ),

                produtoNome:
                  reservatorio
                    ?.produtos
                    ?.nome ||
                  reservatorio
                    ?.nome ||
                  '-',

                capacidade:
                  Number(
                    reservatorio
                      ?.capacidade_l || 0
                  ),

                volumeAnterior,

                volumeAtual,

                nivel:
                  Number(
                    registro.percentual
                  ),

                status:
                  registro.esp32_status ||
                  'Sem comunicação'

              }

            }
          )
          .sort(
            (a, b) => {

              const dataA =
                `${a.data} ${a.hora}`

              const dataB =
                `${b.data} ${b.hora}`

              return dataB.localeCompare(
                dataA
              )

            }
          )


        setMonitoramento(
          registros
        )


        return true

      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar monitoramento:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

        return false

      } finally {

        setCarregandoMonitoramento(false)

      }


  }


  useEffect(() => {

    carregarMonitoramento()

  }, [])


  // =========================
  // PRODUTOS DISPONÍVEIS
  // =========================

  const produtosDisponiveis =
    useMemo(() => {

      if (
        etaFiltro === 'todas'
      ) {

        return produtos

      }


      const eta =
        etas.find(
          (item) =>
            item.id === etaFiltro
        )


      if (!eta) {
        return []
      }


      return produtos.filter(
        (produto) =>
          eta.produtos.some(
            (item) =>
              item.id === produto.id
          )
      )

    }, [etaFiltro, etas, produtos])


  // =========================
  // FILTRO
  // =========================

  const resultados =
    useMemo(() => {

      if (!pesquisou) {
        return []
      }


      return monitoramento.filter(
        (registro) => {

          const dentroInicial =
            !dataInicial ||
            registro.data >= dataInicial


          const dentroFinal =
            !dataFinal ||
            registro.data <= dataFinal


          const correspondeEta =
            etaFiltro === 'todas' ||
            registro.etaId === etaFiltro


          const correspondeProduto =
            produtoFiltro === 'todos' ||
            registro.produtoId === produtoFiltro


          return (
            dentroInicial &&
            dentroFinal &&
            correspondeEta &&
            correspondeProduto
          )

        }
      )

    }, [
      pesquisou,
      monitoramento,
      dataInicial,
      dataFinal,
      etaFiltro,
      produtoFiltro
    ])


  // =========================
  // RESUMO DO PERÍODO
  // =========================

  const resumoPeriodo =
    useMemo(() => {

      if (
        !pesquisou ||
        resultados.length === 0
      ) {

        return {
          consumo: 0,
          tempoAtivoMinutos: 0,
          volumeInicial: 0,
          volumeFinal: 0
        }

      }


      // Agrupa as leituras por reservatório.
      // Isso permite calcular corretamente mesmo
      // quando o filtro mostra mais de um reservatório.
      const grupos = new Map()


      resultados.forEach(
        (registro) => {

          const chave =
            registro.reservatorioId ||
            `${registro.etaId}-${registro.produtoId}`


          if (!grupos.has(chave)) {

            grupos.set(
              chave,
              []
            )

          }


          grupos
            .get(chave)
            .push(registro)

        }
      )


      let consumoTotal = 0
      let tempoAtivoMinutos = 0
      let volumeInicialTotal = 0
      let volumeFinalTotal = 0


      grupos.forEach(
        (leituras) => {

          const ordenadas =
            [...leituras].sort(
              (a, b) =>
                new Date(
                  a.dataHoraOriginal
                ).getTime() -
                new Date(
                  b.dataHoraOriginal
                ).getTime()
            )


          if (ordenadas.length === 0) {
            return
          }


          const volumeInicialGrupo =
            Number(
              ordenadas[0].volumeAtual
            ) || 0


          const volumeFinalGrupo =
            Number(
              ordenadas[
                ordenadas.length - 1
              ].volumeAtual
            ) || 0


          volumeInicialTotal +=
            volumeInicialGrupo

          volumeFinalTotal +=
            volumeFinalGrupo


          // O consumo parte da diferença entre o
          // volume inicial e o final. Aumentos grandes
          // de volume são tratados como reabastecimento.
          // Pequenas oscilações do sensor não entram
          // como consumo adicional.
          let reabastecimentos = 0


          for (
            let i = 1;
            i < ordenadas.length;
            i++
          ) {

            const anterior =
              ordenadas[i - 1]

            const atual =
              ordenadas[i]


            const volumeAnterior =
              Number(
                anterior.volumeAtual
              ) || 0

            const volumeAtual =
              Number(
                atual.volumeAtual
              ) || 0


            const aumentoVolume =
              volumeAtual - volumeAnterior


            // Considera reabastecimento quando o
            // aumento for de pelo menos 5 litros.
            if (aumentoVolume >= 5) {

              reabastecimentos +=
                aumentoVolume

            }


            // TEMPO ATIVO ESTIMADO
            const inicio =
              new Date(
                anterior.dataHoraOriginal
              )

            const fim =
              new Date(
                atual.dataHoraOriginal
              )


            const diferencaMinutos =
              (
                fim.getTime() -
                inicio.getTime()
              ) /
              (1000 * 60)


            // Até 5 minutos entre duas leituras
            // é considerado funcionamento contínuo.
            if (
              diferencaMinutos > 0 &&
              diferencaMinutos <= 5
            ) {

              tempoAtivoMinutos +=
                diferencaMinutos

            }

          }


          const consumoGrupo =
            volumeInicialGrupo +
            reabastecimentos -
            volumeFinalGrupo


          if (consumoGrupo > 0) {

            consumoTotal +=
              consumoGrupo

          }

        }
      )


      return {

        consumo:
          consumoTotal,

        tempoAtivoMinutos,

        volumeInicial:
          volumeInicialTotal,

        volumeFinal:
          volumeFinalTotal

      }

    }, [
      pesquisou,
      resultados
    ])


  // =========================
  // ALTERAR ETA
  // =========================

  function alterarEta(event) {

    setEtaFiltro(
      event.target.value
    )

    setProdutoFiltro('todos')

    setPesquisou(false)

  }


  // =========================
  // BUSCAR
  // =========================

  async function buscar() {

    if (
      dataInicial &&
      dataFinal &&
      dataInicial > dataFinal
    ) {

      alert(
        'A data inicial não pode ser maior que a data final.'
      )

      return
    }


    const carregou =
      await carregarMonitoramento()


    if (carregou !== false) {

      setPesquisou(true)

    }

  }


  // =========================
  // EXPORTAR EXCEL
  // =========================

  function exportarExcel() {

    if (
      resultados.length === 0
    ) {

      alert(
        'Não existem registros para exportar.'
      )

      return
    }


    const dadosExcel =
      resultados.map(
        (registro) => ({

          Data:
            formatarData(
              registro.data
            ),

          Hora:
            registro.hora,

          ETA:
            registro.etaNome,

          Produto:
            registro.produtoNome,

          'Capacidade (L)':
            registro.capacidade,

          'Volume anterior (L)':
            registro.volumeAnterior,

          'Volume atual (L)':
            registro.volumeAtual,

          'Variação (L)':
            calcularVariacao(
              registro.volumeAnterior,
              registro.volumeAtual
            ),

          'Nível (%)':
            registro.nivel,

          Status:
            registro.status

        })
      )


    const planilha =
      XLSX.utils.json_to_sheet(
        dadosExcel
      )


    planilha['!cols'] = [

      { wch: 12 },
      { wch: 8 },

      { wch: 18 },
      { wch: 28 },

      { wch: 15 },

      { wch: 20 },
      { wch: 18 },

      { wch: 14 },

      { wch: 12 },

      { wch: 20 }

    ]


    const arquivo =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      'Monitoramento'
    )


    const nomeEta =
      etaFiltro === 'todas'
        ? 'todas-etas'
        : etaFiltro


    const nomeProduto =
      produtoFiltro === 'todos'
        ? 'todos-produtos'
        : produtoFiltro


    const periodo =
      criarNomePeriodo(
        dataInicial,
        dataFinal
      )


    XLSX.writeFile(
      arquivo,
      `historico-monitoramento-${nomeEta}-${nomeProduto}-${periodo}.xlsx`
    )

  }


  return (

    <div className="pagina-historico-monitoramento">


      {/* CABEÇALHO */}

      <div className="cabecalho-historico-monitoramento">

        <button
          className="botao-voltar-monitoramento"
          type="button"
          onClick={() =>
            navigate('/historico')
          }
        >

          <ArrowLeft size={18} />

          Voltar

        </button>


        <div>

          <span>
            HISTÓRICO
          </span>

          <h1>
            Monitoramento
          </h1>

          <p>
            Consulte as alterações de volume,
            nível e comunicação dos reservatórios.
          </p>

        </div>

      </div>


      {/* FILTROS */}

      <div className="card-filtros-monitoramento">

        <div className="titulo-filtro-monitoramento">

          <Search size={18} />

          <h2>
            Filtros
          </h2>

        </div>


        <div className="grid-filtros-monitoramento">


          <div className="campo-filtro-monitoramento">

            <label>
              Data inicial
            </label>

            <input
              type="date"
              value={dataInicial}
              onChange={(e) => {

                setDataInicial(
                  e.target.value
                )

                setPesquisou(false)

              }}
            />

          </div>


          <div className="campo-filtro-monitoramento">

            <label>
              Data final
            </label>

            <input
              type="date"
              value={dataFinal}
              onChange={(e) => {

                setDataFinal(
                  e.target.value
                )

                setPesquisou(false)

              }}
            />

          </div>


          <div className="campo-filtro-monitoramento">

            <label>
              ETA
            </label>

            <select
              value={etaFiltro}
              onChange={alterarEta}
              disabled={carregandoCadastros}
            >

              <option value="todas">

                {carregandoCadastros
                  ? 'Carregando ETAs...'
                  : 'Todas as ETAs'
                }

              </option>


              {etas.map(
                (eta) => (

                  <option
                    key={eta.id}
                    value={eta.id}
                  >

                    ETA {eta.nome}

                  </option>

                )
              )}

            </select>

          </div>


          <div className="campo-filtro-monitoramento">

            <label>
              Produto
            </label>

            <select
              value={produtoFiltro}
              disabled={carregandoCadastros}
              onChange={(e) => {

                setProdutoFiltro(
                  e.target.value
                )

                setPesquisou(false)

              }}
            >

              <option value="todos">
                Todos os produtos
              </option>


              {produtosDisponiveis.map(
                (produto) => (

                  <option
                    key={produto.id}
                    value={produto.id}
                  >

                    {produto.nome}

                  </option>

                )
              )}

            </select>

          </div>


          <button
            className="botao-buscar-monitoramento"
            type="button"
            onClick={buscar}
            disabled={carregandoMonitoramento || carregandoCadastros}
          >

            <Search size={16} />

            {carregandoMonitoramento || carregandoCadastros
              ? 'Carregando...'
              : 'Buscar'
            }

          </button>

        </div>

      </div>


      {/* CARREGAMENTO */}

      {carregandoMonitoramento && (

        <div className="card-resultados-monitoramento">

          <div className="sem-resultados-monitoramento">
            Carregando monitoramento...
          </div>

        </div>

      )}


      {/* ERRO */}

      {!carregandoMonitoramento &&
       erroCarregamento && (

        <div className="card-resultados-monitoramento">

          <div className="sem-resultados-monitoramento">
            {erroCarregamento}
          </div>

        </div>

      )}


      {/* RESULTADOS */}

      {!carregandoMonitoramento &&
       !erroCarregamento &&
       pesquisou && (

        <div className="card-resultados-monitoramento">


          <div className="topo-resultados-monitoramento">

            <div>

              <div className="titulo-resultados-monitoramento">

                <Radio size={18} />

                <h2>
                  Resultados
                </h2>

              </div>


              <span>

                {resultados.length}
                {' '}

                {resultados.length === 1
                  ? 'registro encontrado'
                  : 'registros encontrados'
                }

              </span>

            </div>


            <button
              className="botao-exportar-monitoramento"
              type="button"
              disabled={
                resultados.length === 0
              }
              onClick={exportarExcel}
            >

              <FileSpreadsheet size={17} />

              Exportar Excel

            </button>

          </div>


          {resultados.length > 0 && (

            <div
              className="resumo-monitoramento"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                margin: '18px 0 20px'
              }}
            >


              <div
                className="card-resumo-monitoramento"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: '#eaf2ff',
                    color: '#2563eb'
                  }}
                >
                  <Droplets size={21} />
                </div>

                <div>

                  <span
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      color: '#64748b',
                      fontSize: '12px'
                    }}
                  >
                    Consumo no período
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      color: '#0f172a',
                      fontSize: '18px'
                    }}
                  >
                    {formatarNumero(
                      resumoPeriodo.consumo
                    )} L
                  </strong>

                </div>

              </div>


              <div
                className="card-resumo-monitoramento"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: '#eefbf3',
                    color: '#15803d'
                  }}
                >
                  <Clock3 size={21} />
                </div>

                <div>

                  <span
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      color: '#64748b',
                      fontSize: '12px'
                    }}
                  >
                    Tempo ativo estimado
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      color: '#0f172a',
                      fontSize: '18px'
                    }}
                  >
                    {formatarTempoAtivo(
                      resumoPeriodo.tempoAtivoMinutos
                    )}
                  </strong>

                </div>

              </div>


              <div
                className="card-resumo-monitoramento"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: '#f3f4f6',
                    color: '#475569'
                  }}
                >
                  <Gauge size={21} />
                </div>

                <div>

                  <span
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      color: '#64748b',
                      fontSize: '12px'
                    }}
                  >
                    Volume inicial
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      color: '#0f172a',
                      fontSize: '18px'
                    }}
                  >
                    {formatarNumero(
                      resumoPeriodo.volumeInicial
                    )} L
                  </strong>

                </div>

              </div>


              <div
                className="card-resumo-monitoramento"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              >

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    borderRadius: '10px',
                    background: '#fff7ed',
                    color: '#c2410c'
                  }}
                >
                  <TrendingDown size={21} />
                </div>

                <div>

                  <span
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      color: '#64748b',
                      fontSize: '12px'
                    }}
                  >
                    Volume final
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      color: '#0f172a',
                      fontSize: '18px'
                    }}
                  >
                    {formatarNumero(
                      resumoPeriodo.volumeFinal
                    )} L
                  </strong>

                </div>

              </div>


            </div>

          )}


          {resultados.length === 0 ? (

            <div className="sem-resultados-monitoramento">

              Nenhum registro de monitoramento
              encontrado para os filtros selecionados.

            </div>

          ) : (

            <div className="tabela-monitoramento-wrapper">

              <table className="tabela-historico-monitoramento">


                <thead>

                  <tr>

                    <th>
                      Data
                    </th>

                    <th>
                      Hora
                    </th>

                    <th>
                      ETA
                    </th>

                    <th>
                      Produto
                    </th>

                    <th>
                      Volume anterior
                    </th>

                    <th>
                      Volume atual
                    </th>

                    <th>
                      Variação
                    </th>

                    <th>
                      Nível
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {resultados.map(
                    (registro) => {

                      const variacao =
                        calcularVariacao(
                          registro.volumeAnterior,
                          registro.volumeAtual
                        )


                      return (

                        <tr key={registro.id}>

                          <td>
                            {formatarData(
                              registro.data
                            )}
                          </td>

                          <td>
                            {registro.hora}
                          </td>

                          <td>
                            {registro.etaNome}
                          </td>

                          <td className="celula-produto-monitoramento">
                            {registro.produtoNome}
                          </td>

                          <td>
                            {formatarNumero(
                              registro.volumeAnterior
                            )} L
                          </td>

                          <td>
                            {formatarNumero(
                              registro.volumeAtual
                            )} L
                          </td>

                          <td
                            className={
                              variacao < 0
                                ? 'variacao-negativa'
                                : variacao > 0
                                  ? 'variacao-positiva'
                                  : ''
                            }
                          >

                            {variacao > 0
                              ? '+'
                              : ''
                            }

                            {formatarNumero(
                              variacao
                            )} L

                          </td>

                          <td>
                            {formatarNumero(
                              registro.nivel
                            )}%
                          </td>

                          <td>

                            <span
                              className={
                                registro.status === 'Online'
                                  ? 'status-monitoramento online'
                                  : 'status-monitoramento offline'
                              }
                            >

                              {registro.status}

                            </span>

                          </td>

                        </tr>

                      )

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

    </div>

  )

}


// =========================
// AUXILIARES
// =========================

function converterProdutoSlugParaLocal(
  slug
) {

  if (
    slug === 'acido-fluossilicico'
  ) {

    return 'fluor'

  }


  if (
    slug === 'hidroxido-sodio'
  ) {

    return 'hidroxido'

  }


  return slug || ''

}


function calcularVariacao(
  volumeAnterior,
  volumeAtual
) {

  return Number(volumeAtual) -
    Number(volumeAnterior)

}


function formatarData(data) {

  if (!data) {
    return '-'
  }


  const [
    ano,
    mes,
    dia
  ] = data.split('-')


  return `${dia}/${mes}/${ano}`

}


function formatarNumero(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return '-'

  }


  return Number(valor)
    .toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )

}


function formatarTempoAtivo(
  minutos
) {

  const minutosArredondados =
    Math.round(
      Number(minutos) || 0
    )


  const horas =
    Math.floor(
      minutosArredondados / 60
    )


  const minutosRestantes =
    minutosArredondados % 60


  if (horas === 0) {

    return `${minutosRestantes} min`

  }


  return `${horas} h ${minutosRestantes} min`

}


function criarNomePeriodo(
  dataInicial,
  dataFinal
) {

  if (
    dataInicial &&
    dataFinal
  ) {

    return `${dataInicial}-a-${dataFinal}`

  }


  if (dataInicial) {

    return `desde-${dataInicial}`

  }


  if (dataFinal) {

    return `ate-${dataFinal}`

  }


  return 'todos-os-registros'

}


export default HistoricoMonitoramento