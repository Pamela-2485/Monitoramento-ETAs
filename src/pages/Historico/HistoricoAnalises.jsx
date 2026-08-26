import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Search,
  FileSpreadsheet,
  ClipboardCheck
} from 'lucide-react'

import * as XLSX from 'xlsx'

import { supabase } from '../../lib/supabase'

import './HistoricoAnalises.css'


function HistoricoAnalises() {

  const navigate = useNavigate()


  // =========================
  // ETAs DO SUPABASE
  // =========================

  const [etas, setEtas] =
    useState([])

  const [
    carregandoEtas,
    setCarregandoEtas
  ] = useState(true)


  const [dataInicial, setDataInicial] =
    useState('')

  const [dataFinal, setDataFinal] =
    useState('')

  const [etaFiltro, setEtaFiltro] =
    useState('todas')

  const [pesquisou, setPesquisou] =
    useState(false)


  // =========================
  // DADOS DO SUPABASE
  // =========================

  const [analises, setAnalises] =
    useState([])

  const [
    carregandoAnalises,
    setCarregandoAnalises
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


  // =========================
  // CARREGAR ETAs
  // =========================

  useEffect(() => {

    async function carregarEtas() {

      setCarregandoEtas(true)


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('etas')
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


        if (error) {

          console.error(
            'Erro ao carregar ETAs:',
            error
          )

          return

        }


        const etasFormatadas =
          (data || []).map(
            (eta) => ({

              id:
                eta.slug,

              bancoId:
                eta.id,

              nome:
                eta.nome

            })
          )


        setEtas(
          etasFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar ETAs:',
          erro
        )

      } finally {

        setCarregandoEtas(false)

      }

    }


    carregarEtas()

  }, [])


  // =========================
  // CARREGAR ANÁLISES
  // =========================

  useEffect(() => {

    async function carregarAnalises() {

      setCarregandoAnalises(true)
      setErroCarregamento('')


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('analises')
            .select(`
              id,
              data_analise,
              vazao_eta_m3_h,

              cloro_residual_mg_l,
              fluor_mg_l,
              turbidez_ntu,
              cor_eta_uh,
              ph,

              cloro_rede_mg_l,
              fluor_rede_mg_l,
              turbidez_rede_ntu,
              cor_rede_uh,
              ph_rede,

              observacao,

              etas (
                slug,
                nome
              )
            `)
            .order(
              'data_analise',
              {
                ascending: true
              }
            )


        if (error) {

          console.error(
            'Erro ao carregar análises:',
            error
          )

          setErroCarregamento(
            'Não foi possível carregar as análises.'
          )

          return
        }


        const registros =
          (data || []).map(
            (registro) =>
              formatarAnaliseBanco(
                registro
              )
          )


        setAnalises(
          registros
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar análises:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregandoAnalises(false)

      }

    }


    carregarAnalises()

  }, [])


  // =========================
  // FILTRO
  // =========================

  const registrosFiltrados =
    useMemo(() => {

      if (!pesquisou) {
        return []
      }


      return analises.filter(
        (analise) => {

          const dentroInicial =
            !dataInicial ||
            analise.data >= dataInicial


          const dentroFinal =
            !dataFinal ||
            analise.data <= dataFinal


          const correspondeEta =
            etaFiltro === 'todas' ||
            analise.etaId === etaFiltro


          return (
            dentroInicial &&
            dentroFinal &&
            correspondeEta
          )

        }
      )

    }, [
      pesquisou,
      analises,
      dataInicial,
      dataFinal,
      etaFiltro
    ])


  // =========================
  // DATAS ENCONTRADAS
  // =========================

  const datasEncontradas =
    useMemo(() => {

      const datas =
        registrosFiltrados.map(
          (registro) =>
            registro.data
        )


      return [
        ...new Set(datas)
      ].sort()

    }, [registrosFiltrados])


  // =========================
  // BUSCAR REGISTRO POR ETA/DATA
  // =========================

  function obterRegistro(
    data,
    etaId
  ) {

    const registros =
      registrosFiltrados
        .filter(
          (registro) =>
            registro.data === data &&
            registro.etaId === etaId
        )
        .sort(
          (a, b) =>
            b.hora.localeCompare(
              a.hora
            )
        )


    return registros[0] || null

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
      registrosFiltrados.length === 0
    ) {

      alert(
        'Não existem registros para exportar.'
      )

      return
    }


    const linhasExcel = []


    datasEncontradas.forEach(
      (data) => {

        const parametros = [

          {
            nome: 'Cloro',
            campo: 'cloro'
          },

          {
            nome: 'Flúor',
            campo: 'fluor'
          },

          {
            nome: 'Turbidez',
            campo: 'turbidez'
          },

          {
            nome: 'Cor',
            campo: 'cor'
          },

          {
            nome: 'pH',
            campo: 'ph'
          }

        ]


        parametros.forEach(
          (parametro) => {

            const esplanada =
              obterRegistro(
                data,
                'esplanada'
              )

            const torneiro =
              obterRegistro(
                data,
                'torneiro'
              )

            const olhoDagua =
              obterRegistro(
                data,
                'olho-dagua'
              )

            const campoBom =
              obterRegistro(
                data,
                'campo-bom'
              )


            linhasExcel.push({

              Data:
                formatarData(
                  data
                ),

              Análise:
                parametro.nome,


              'Esplanada ETA':
                valorExcel(
                  esplanada?.eta?.[
                    parametro.campo
                  ]
                ),

              'Esplanada Rede':
                valorExcel(
                  esplanada?.rede?.[
                    parametro.campo
                  ]
                ),


              'Torneiro ETA':
                valorExcel(
                  torneiro?.eta?.[
                    parametro.campo
                  ]
                ),

              'Torneiro Rede':
                valorExcel(
                  torneiro?.rede?.[
                    parametro.campo
                  ]
                ),


              "Olho D'água ETA":
                valorExcel(
                  olhoDagua?.eta?.[
                    parametro.campo
                  ]
                ),

              "Olho D'água Rede":
                valorExcel(
                  olhoDagua?.rede?.[
                    parametro.campo
                  ]
                ),


              'Campo Bom ETA':
                valorExcel(
                  campoBom?.eta?.[
                    parametro.campo
                  ]
                ),

              'Campo Bom Rede':
                valorExcel(
                  campoBom?.rede?.[
                    parametro.campo
                  ]
                )

            })

          }
        )

      }
    )


    const planilha =
      XLSX.utils.json_to_sheet(
        linhasExcel
      )


    planilha['!cols'] = [

      { wch: 12 },
      { wch: 13 },

      { wch: 14 },
      { wch: 14 },

      { wch: 14 },
      { wch: 14 },

      { wch: 16 },
      { wch: 16 },

      { wch: 14 },
      { wch: 14 }

    ]


    const arquivo =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      'Análises'
    )


    const nomeEta =
      etaFiltro === 'todas'
        ? 'todas-etas'
        : etaFiltro


    XLSX.writeFile(
      arquivo,
      `historico-analises-${nomeEta}-${criarNomePeriodo(
        dataInicial,
        dataFinal
      )}.xlsx`
    )

  }


  return (

    <div className="pagina-historico-analises">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-historico-analises">

        <button
          className="botao-voltar-historico-analises"
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
            Análises
          </h1>

          <p>
            Consulte as análises realizadas
            por período e exporte para Excel.
          </p>

        </div>

      </div>


      {/* =========================
          FILTROS
      ========================= */}

      <div className="card-filtros-analises">

        <div className="titulo-filtro-analises">

          <Search size={18} />

          <h2>
            Filtros
          </h2>

        </div>


        <div className="grid-filtros-analises">


          <div className="campo-filtro-analises">

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


          <div className="campo-filtro-analises">

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


          <div className="campo-filtro-analises">

            <label>
              ETA
            </label>

            <select
              value={etaFiltro}
              disabled={carregandoEtas}
              onChange={(e) => {

                setEtaFiltro(
                  e.target.value
                )

                setPesquisou(false)

              }}
            >

              <option value="todas">

                {carregandoEtas
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


          <button
            className="botao-buscar-analises"
            type="button"
            onClick={buscar}
            disabled={carregandoAnalises}
          >

            <Search size={16} />

            {carregandoAnalises
              ? 'Carregando...'
              : 'Buscar'
            }

          </button>

        </div>

      </div>


      {/* =========================
          CARREGAMENTO
      ========================= */}

      {carregandoAnalises && (

        <div className="card-resultados-analises">

          <div className="sem-resultados-analises">

            Carregando análises...

          </div>

        </div>

      )}


      {/* =========================
          ERRO
      ========================= */}

      {!carregandoAnalises &&
       erroCarregamento && (

        <div className="card-resultados-analises">

          <div className="sem-resultados-analises">

            {erroCarregamento}

          </div>

        </div>

      )}


      {/* =========================
          RESULTADOS
      ========================= */}

      {!carregandoAnalises &&
       !erroCarregamento &&
       pesquisou && (

        <div className="card-resultados-analises">


          <div className="topo-resultados-analises">

            <div>

              <div className="titulo-resultados-analises">

                <ClipboardCheck size={18} />

                <h2>
                  Resultados
                </h2>

              </div>


              <span>

                {registrosFiltrados.length}
                {' '}

                {registrosFiltrados.length === 1
                  ? 'registro encontrado'
                  : 'registros encontrados'
                }

              </span>

            </div>


            <button
              className="botao-exportar-excel"
              type="button"
              disabled={
                registrosFiltrados.length === 0
              }
              onClick={exportarExcel}
            >

              <FileSpreadsheet size={17} />

              Exportar Excel

            </button>

          </div>


          {registrosFiltrados.length === 0 ? (

            <div className="sem-resultados-analises">

              Nenhuma análise encontrada
              para os filtros selecionados.

            </div>

          ) : (

            <div className="tabela-historico-wrapper">

              <table className="tabela-historico-analises">


                <colgroup>

                  <col className="coluna-data" />

                  <col className="coluna-analise" />

                  <col />
                  <col />

                  <col />
                  <col />

                  <col />
                  <col />

                  <col />
                  <col />

                </colgroup>


                <thead>

                  <tr>

                    <th rowSpan="2">
                      DATA
                    </th>

                    <th rowSpan="2">
                      ANÁLISE
                    </th>


                    <th colSpan="2">
                      ESPLANADA
                    </th>

                    <th colSpan="2">
                      TORNEIRO
                    </th>

                    <th colSpan="2">
                      OLHO D'ÁGUA
                    </th>

                    <th colSpan="2">
                      CAMPO BOM
                    </th>

                  </tr>


                  <tr>

                    <th>ETA</th>
                    <th>REDE</th>

                    <th>ETA</th>
                    <th>REDE</th>

                    <th>ETA</th>
                    <th>REDE</th>

                    <th>ETA</th>
                    <th>REDE</th>

                  </tr>

                </thead>


                <tbody>

                  {datasEncontradas.map(
                    (data) => (

                      <BlocoData
                        key={data}
                        data={data}

                        esplanada={
                          obterRegistro(
                            data,
                            'esplanada'
                          )
                        }

                        torneiro={
                          obterRegistro(
                            data,
                            'torneiro'
                          )
                        }

                        olhoDagua={
                          obterRegistro(
                            data,
                            'olho-dagua'
                          )
                        }

                        campoBom={
                          obterRegistro(
                            data,
                            'campo-bom'
                          )
                        }
                      />

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
// FORMATAR DADO DO BANCO
// =========================

function formatarAnaliseBanco(
  registro
) {

  const dataHora =
    new Date(
      registro.data_analise
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


    eta: {

      cloro:
        numeroOuNull(
          registro.cloro_residual_mg_l
        ),

      fluor:
        numeroOuNull(
          registro.fluor_mg_l
        ),

      turbidez:
        numeroOuNull(
          registro.turbidez_ntu
        ),

      cor:
        numeroOuNull(
          registro.cor_eta_uh
        ),

      ph:
        numeroOuNull(
          registro.ph
        )

    },


    rede: {

      cloro:
        numeroOuNull(
          registro.cloro_rede_mg_l
        ),

      fluor:
        numeroOuNull(
          registro.fluor_rede_mg_l
        ),

      turbidez:
        numeroOuNull(
          registro.turbidez_rede_ntu
        ),

      cor:
        numeroOuNull(
          registro.cor_rede_uh
        ),

      ph:
        numeroOuNull(
          registro.ph_rede
        )

    }

  }

}


// =========================
// BLOCO POR DATA
// =========================

function BlocoData({
  data,
  esplanada,
  torneiro,
  olhoDagua,
  campoBom
}) {

  const parametros = [

    {
      nome: 'CLORO',
      campo: 'cloro'
    },

    {
      nome: 'FLÚOR',
      campo: 'fluor'
    },

    {
      nome: 'TURBIDEZ',
      campo: 'turbidez'
    },

    {
      nome: 'COR',
      campo: 'cor'
    },

    {
      nome: 'PH',
      campo: 'ph'
    }

  ]


  return (

    <>

      {parametros.map(
        (
          parametro,
          index
        ) => (

          <tr
            key={`${data}-${parametro.campo}`}
          >


            {index === 0 && (

              <td
                rowSpan="5"
                className="celula-data-historico"
              >

                {formatarData(
                  data
                )}

              </td>

            )}


            <td className="celula-parametro-historico">

              {parametro.nome}

            </td>


            <ValorHistorico
              registro={esplanada}
              local="eta"
              parametro={parametro.campo}
            />

            <ValorHistorico
              registro={esplanada}
              local="rede"
              parametro={parametro.campo}
            />


            <ValorHistorico
              registro={torneiro}
              local="eta"
              parametro={parametro.campo}
            />

            <ValorHistorico
              registro={torneiro}
              local="rede"
              parametro={parametro.campo}
            />


            <ValorHistorico
              registro={olhoDagua}
              local="eta"
              parametro={parametro.campo}
            />

            <ValorHistorico
              registro={olhoDagua}
              local="rede"
              parametro={parametro.campo}
            />


            <ValorHistorico
              registro={campoBom}
              local="eta"
              parametro={parametro.campo}
            />

            <ValorHistorico
              registro={campoBom}
              local="rede"
              parametro={parametro.campo}
            />

          </tr>

        )
      )}

    </>

  )

}


// =========================
// VALOR DA CÉLULA
// =========================

function ValorHistorico({
  registro,
  local,
  parametro
}) {

  if (!registro) {

    return (

      <td className="celula-valor-historico">
        -
      </td>

    )

  }


  const valor =
    registro?.[local]?.[parametro]


  return (

    <td className="celula-valor-historico">

      {formatarValor(
        valor
      )}

    </td>

  )

}


// =========================
// AUXILIARES
// =========================

function numeroOuNull(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return null

  }


  return Number(valor)

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


function formatarValor(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {

    return '-'

  }


  return Number(valor)
    .toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )

}


function valorExcel(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return ''

  }


  return valor

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


export default HistoricoAnalises