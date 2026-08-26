import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Search,
  Gauge,
  FileSpreadsheet
} from 'lucide-react'

import * as XLSX from 'xlsx'

import { supabase } from '../../lib/supabase'

import './HistoricoCalibracoes.css'


function HistoricoCalibracoes() {

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

  const [calibracoes, setCalibracoes] =
    useState([])

  const [
    carregandoCalibracoes,
    setCarregandoCalibracoes
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
                  converterProdutoIdBancoParaLocal(
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
                            converterProdutoIdBancoParaLocal(
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
  // CARREGAR CALIBRAÇÕES
  // =========================

  useEffect(() => {

    async function carregarCalibracoes() {

      setCarregandoCalibracoes(true)
      setErroCarregamento('')


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('calibracoes')
            .select(`
              id,
              pulsacao,
              cursor,
              tempo_coleta_segundos,
              volume_coletado_ml,
              vazao_real_l_h,
              data_calibracao,

              dosadoras (
                codigo,
                nome,

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
              'data_calibracao',
              {
                ascending: false
              }
            )


        if (error) {

          console.error(
            'Erro ao carregar calibrações:',
            error
          )

          setErroCarregamento(
            'Não foi possível carregar as calibrações.'
          )

          setCarregandoCalibracoes(false)

          return
        }


        const calibracoesFormatadas =
          (data || []).map(
            (registro) => {

              const dataHora =
                new Date(
                  registro.data_calibracao
                )


              const dataFormatada =
                dataHora
                  .toLocaleDateString(
                    'sv-SE'
                  )


              const horaFormatada =
                dataHora
                  .toLocaleTimeString(
                    'pt-BR',
                    {
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )


              const etaBanco =
                registro.dosadoras?.etas


              const produtoBanco =
                registro.dosadoras?.produtos


              return {

                id:
                  registro.id,

                data:
                  dataFormatada,

                hora:
                  horaFormatada,

                etaId:
                  etaBanco?.slug || '',

                etaNome:
                  etaBanco?.nome || '-',

                produtoId:
                  converterProdutoIdBancoParaLocal(
                    produtoBanco?.slug
                  ),

                produtoNome:
                  produtoBanco?.nome || '-',

                vazaoDosadora:
                  Number(
                    registro.vazao_real_l_h
                  ),

                cursor:
                  registro.cursor !== null
                    ? Number(registro.cursor)
                    : null,

                pulsacao:
                  registro.pulsacao !== null
                    ? Number(registro.pulsacao)
                    : null,

                tempoColeta:
                  Number(
                    registro
                      .tempo_coleta_segundos
                  ),

                volumeColetado:
                  Number(
                    registro
                      .volume_coletado_ml
                  )

              }

            }
          )


        setCalibracoes(
          calibracoesFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar calibrações:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregandoCalibracoes(false)

      }

    }


    carregarCalibracoes()

  }, [])


  // =========================
  // PRODUTOS DISPONÍVEIS
  // =========================

  const produtosDisponiveis =
    useMemo(() => {

      if (etaFiltro === 'todas') {

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
  // RESULTADOS
  // =========================

  const resultados =
    useMemo(() => {

      if (!pesquisou) {

        return []

      }


      return calibracoes.filter(
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
            registro.produtoId ===
              produtoFiltro


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
      calibracoes,
      dataInicial,
      dataFinal,
      etaFiltro,
      produtoFiltro
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

  function buscar() {

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


    setPesquisou(true)

  }


  // =========================
  // EXPORTAR EXCEL
  // =========================

  function exportarExcel() {

    if (resultados.length === 0) {

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

          'Vazão da dosadora (L/h)':
            registro.vazaoDosadora,

          'Cursor (%)':
            registro.cursor,

          'Pulsação (%)':
            registro.pulsacao,

          'Tempo de coleta (s)':
            registro.tempoColeta,

          'Volume coletado (mL)':
            registro.volumeColetado

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
      { wch: 23 },
      { wch: 13 },
      { wch: 15 },
      { wch: 20 },
      { wch: 22 }
    ]


    const arquivo =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      'Calibrações'
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
      `historico-calibracoes-${nomeEta}-${nomeProduto}-${periodo}.xlsx`
    )

  }


  return (

    <div className="pagina-historico-calibracoes">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-historico-calibracoes">

        <button
          className="botao-voltar-calibracoes"
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
            Calibrações
          </h1>

          <p>
            Consulte as calibrações realizadas
            nas dosadoras das ETAs.
          </p>

        </div>

      </div>


      {/* =========================
          FILTROS
      ========================= */}

      <div className="card-filtros-calibracoes">

        <div className="titulo-filtro-calibracoes">

          <Search size={18} />

          <h2>
            Filtros
          </h2>

        </div>


        <div className="grid-filtros-calibracoes">


          <div className="campo-filtro-calibracoes">

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


          <div className="campo-filtro-calibracoes">

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


          <div className="campo-filtro-calibracoes">

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


          <div className="campo-filtro-calibracoes">

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
            className="botao-buscar-calibracoes"
            type="button"
            onClick={buscar}
            disabled={carregandoCalibracoes || carregandoCadastros}
          >

            <Search size={16} />

            {carregandoCalibracoes || carregandoCadastros
              ? 'Carregando...'
              : 'Buscar'
            }

          </button>

        </div>

      </div>


      {/* =========================
          CARREGAMENTO / ERRO
      ========================= */}

      {carregandoCalibracoes && (

        <div className="card-resultados-calibracoes">

          <div className="sem-resultados-calibracoes">

            Carregando calibrações...

          </div>

        </div>

      )}


      {!carregandoCalibracoes &&
       erroCarregamento && (

        <div className="card-resultados-calibracoes">

          <div className="sem-resultados-calibracoes">

            {erroCarregamento}

          </div>

        </div>

      )}


      {/* =========================
          RESULTADOS
      ========================= */}

      {!carregandoCalibracoes &&
       !erroCarregamento &&
       pesquisou && (

        <div className="card-resultados-calibracoes">


          <div className="topo-resultados-calibracoes">

            <div>

              <div className="titulo-resultados-calibracoes">

                <Gauge size={18} />

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
              className="botao-exportar-calibracoes"
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


          {resultados.length === 0 ? (

            <div className="sem-resultados-calibracoes">

              Nenhuma calibração encontrada
              para os filtros selecionados.

            </div>

          ) : (

            <div className="tabela-calibracoes-wrapper">

              <table className="tabela-historico-calibracoes">

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
                      Vazão dosadora
                    </th>

                    <th>
                      Cursor
                    </th>

                    <th>
                      Pulsação
                    </th>

                    <th>
                      Tempo coleta
                    </th>

                    <th>
                      Volume coletado
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {resultados.map(
                    (registro) => (

                      <tr
                        key={registro.id}
                      >

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


                        <td className="celula-produto-calibracao">

                          {registro.produtoNome}

                        </td>


                        <td>

                          {formatarNumero(
                            registro.vazaoDosadora
                          )} L/h

                        </td>


                        <td>

                          {formatarNumero(
                            registro.cursor
                          )}%

                        </td>


                        <td>

                          {formatarNumero(
                            registro.pulsacao
                          )}%

                        </td>


                        <td>

                          {formatarNumero(
                            registro.tempoColeta
                          )} s

                        </td>


                        <td>

                          {formatarNumero(
                            registro.volumeColetado
                          )} mL

                        </td>

                      </tr>

                    )
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

function converterProdutoIdBancoParaLocal(
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


function formatarData(data) {

  if (!data) {

    return '-'

  }


  const [ano, mes, dia] =
    data.split('-')


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


export default HistoricoCalibracoes