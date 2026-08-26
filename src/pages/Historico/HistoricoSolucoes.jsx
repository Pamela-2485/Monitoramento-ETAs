import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Search,
  FlaskConical,
  FileSpreadsheet
} from 'lucide-react'

import * as XLSX from 'xlsx'

import { supabase } from '../../lib/supabase'

import './HistoricoSolucoes.css'


function HistoricoSolucoes() {

  const navigate = useNavigate()


  // =========================
  // DADOS DO SUPABASE
  // =========================

  const [etas, setEtas] =
    useState([])

  const [produtos, setProdutos] =
    useState([])

  const [solucoes, setSolucoes] =
    useState([])

  const [
    carregandoDados,
    setCarregandoDados
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


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
  // CARREGAR DADOS
  // =========================

  useEffect(() => {

    async function carregarDados() {

      setCarregandoDados(true)
      setErroCarregamento('')


      try {

        const [
          respostaEtas,
          respostaProdutos,
          respostaSolucoes
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
            ),

          supabase
            .from('preparos_solucoes')
            .select(`
              id,
              data_preparo,
              agua_l,
              produto_l,
              volume_final_l,
              vazao_eta_m3_h,
              vazao_dosadora_l_h,
              cursor_percentual,
              pulsacao_percentual,

              etas (
                slug,
                nome
              ),

              produtos (
                slug,
                nome
              )
            `)
            .order(
              'data_preparo',
              {
                ascending: false
              }
            )

        ])


        if (respostaEtas.error) {

          console.error(
            'Erro ao carregar ETAs:',
            respostaEtas.error
          )

          setErroCarregamento(
            'Não foi possível carregar as ETAs.'
          )

          return
        }


        if (respostaProdutos.error) {

          console.error(
            'Erro ao carregar produtos:',
            respostaProdutos.error
          )

          setErroCarregamento(
            'Não foi possível carregar os produtos.'
          )

          return
        }


        if (respostaSolucoes.error) {

          console.error(
            'Erro ao carregar soluções:',
            respostaSolucoes.error
          )

          setErroCarregamento(
            'Não foi possível carregar o histórico de soluções.'
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


        const solucoesFormatadas =
          (respostaSolucoes.data || [])
            .map(
              (registro) =>
                formatarSolucaoBanco(
                  registro
                )
            )


        setProdutos(
          produtosFormatados
        )

        setEtas(
          etasFormatadas
        )

        setSolucoes(
          solucoesFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar histórico de soluções:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregandoDados(false)

      }

    }


    carregarDados()

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


      return solucoes.filter(
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
      solucoes,
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

          'Água (L)':
            registro.agua,

          'Produto utilizado (L)':
            registro.produto,

          'Volume final (L)':
            registro.volumeFinal,

          'Vazão ETA (m³/h)':
            registro.vazaoEta ?? '',

          'Vazão dosadora (L/h)':
            registro.vazaoDosadora ?? '',

          'Cursor (%)':
            registro.cursor ?? '',

          'Pulsação (%)':
            registro.pulsacao ?? ''

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

      { wch: 12 },
      { wch: 20 },

      { wch: 17 },

      { wch: 18 },
      { wch: 22 },

      { wch: 12 },
      { wch: 14 }

    ]


    const arquivo =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      'Soluções'
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
      `historico-solucoes-${nomeEta}-${nomeProduto}-${periodo}.xlsx`
    )

  }


  return (

    <div className="pagina-historico-solucoes">


      {/* CABEÇALHO */}

      <div className="cabecalho-historico-solucoes">

        <button
          className="botao-voltar-historico-solucoes"
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
            Soluções
          </h1>

          <p>
            Consulte os preparos realizados
            nas ETAs por período, produto
            e localidade.
          </p>

        </div>

      </div>


      {/* FILTROS */}

      <div className="card-filtros-solucoes">

        <div className="titulo-filtro-solucoes">

          <Search size={18} />

          <h2>
            Filtros
          </h2>

        </div>


        <div className="grid-filtros-solucoes">


          <div className="campo-filtro-solucoes">

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


          <div className="campo-filtro-solucoes">

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


          <div className="campo-filtro-solucoes">

            <label>
              ETA
            </label>

            <select
              value={etaFiltro}
              onChange={alterarEta}
              disabled={carregandoDados}
            >

              <option value="todas">

                {carregandoDados
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


          <div className="campo-filtro-solucoes">

            <label>
              Produto
            </label>

            <select
              value={produtoFiltro}
              disabled={carregandoDados}
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
            className="botao-buscar-solucoes"
            type="button"
            onClick={buscar}
            disabled={carregandoDados}
          >

            <Search size={16} />

            {carregandoDados
              ? 'Carregando...'
              : 'Buscar'
            }

          </button>

        </div>

      </div>


      {/* CARREGAMENTO */}

      {carregandoDados && (

        <div className="card-resultados-solucoes">

          <div className="sem-resultados-solucoes">
            Carregando histórico de soluções...
          </div>

        </div>

      )}


      {/* ERRO */}

      {!carregandoDados &&
       erroCarregamento && (

        <div className="card-resultados-solucoes">

          <div className="sem-resultados-solucoes">
            {erroCarregamento}
          </div>

        </div>

      )}


      {/* RESULTADOS */}

      {!carregandoDados &&
       !erroCarregamento &&
       pesquisou && (

        <div className="card-resultados-solucoes">


          <div className="topo-resultados-solucoes">

            <div>

              <div className="titulo-resultados-solucoes">

                <FlaskConical size={18} />

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
              className="botao-exportar-solucoes"
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

            <div className="sem-resultados-solucoes">

              Nenhuma solução encontrada
              para os filtros selecionados.

            </div>

          ) : (

            <div className="tabela-solucoes-wrapper">

              <table className="tabela-historico-solucoes">


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
                      Água
                    </th>

                    <th>
                      Produto utilizado
                    </th>

                    <th>
                      Volume final
                    </th>

                    <th>
                      Vazão ETA
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

                  </tr>

                </thead>


                <tbody>

                  {resultados.map(
                    (registro) => (

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

                        <td className="celula-produto-solucao">
                          {registro.produtoNome}
                        </td>

                        <td>
                          {formatarNumero(
                            registro.agua
                          )} L
                        </td>

                        <td>
                          {formatarNumero(
                            registro.produto
                          )} L
                        </td>

                        <td>
                          {formatarNumero(
                            registro.volumeFinal
                          )} L
                        </td>

                        <td>

                          {registro.vazaoEta !== null &&
                          registro.vazaoEta !== undefined
                            ? `${formatarNumero(
                                registro.vazaoEta
                              )} m³/h`
                            : '-'
                          }

                        </td>

                        <td>

                          {registro.vazaoDosadora !== null &&
                          registro.vazaoDosadora !== undefined
                            ? `${formatarNumero(
                                registro.vazaoDosadora
                              )} L/h`
                            : '-'
                          }

                        </td>

                        <td>

                          {registro.cursor !== null &&
                          registro.cursor !== undefined
                            ? `${formatarNumero(
                                registro.cursor
                              )}%`
                            : '-'
                          }

                        </td>

                        <td>

                          {registro.pulsacao !== null &&
                          registro.pulsacao !== undefined
                            ? `${formatarNumero(
                                registro.pulsacao
                              )}%`
                            : '-'
                          }

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
// FORMATAR SOLUÇÃO DO BANCO
// =========================

function formatarSolucaoBanco(
  registro
) {

  const dataHora =
    new Date(
      registro.data_preparo
    )


  const data =
    dataHora.toLocaleDateString(
      'sv-SE'
    )


  const hora =
    dataHora.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    )


  return {

    id:
      registro.id,

    data,

    hora,

    etaId:
      registro.etas?.slug || '',

    etaNome:
      registro.etas?.nome || '-',

    produtoId:
      converterProdutoSlugParaLocal(
        registro.produtos?.slug
      ),

    produtoNome:
      registro.produtos?.nome || '-',

    agua:
      numeroOuNull(
        registro.agua_l
      ),

    produto:
      numeroOuNull(
        registro.produto_l
      ),

    volumeFinal:
      numeroOuNull(
        registro.volume_final_l
      ),

    vazaoEta:
      numeroOuNull(
        registro.vazao_eta_m3_h
      ),

    vazaoDosadora:
      numeroOuNull(
        registro.vazao_dosadora_l_h
      ),

    cursor:
      numeroOuNull(
        registro.cursor_percentual
      ),

    pulsacao:
      numeroOuNull(
        registro.pulsacao_percentual
      )

  }

}


// =========================
// SLUG DO BANCO → ID LOCAL
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


// =========================
// NÚMERO OU NULL
// =========================

function numeroOuNull(
  valor
) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return null

  }


  return Number(valor)

}


// =========================
// AUXILIARES
// =========================

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


export default HistoricoSolucoes