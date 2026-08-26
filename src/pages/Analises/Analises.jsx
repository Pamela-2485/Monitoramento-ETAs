import {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  ClipboardCheck,
  Save,
  Droplets,
  MapPin,
  ImageDown
} from 'lucide-react'

import html2canvas from 'html2canvas'

import { supabase } from '../../lib/supabase'

import './Analises.css'


function Analises() {

  const relatorioIndividualRef = useRef(null)
  const relatorioGeralRef = useRef(null)


  // =========================
  // ETAs DO SUPABASE
  // =========================

  const [etas, setEtas] =
    useState([])

  const [
    carregandoEtas,
    setCarregandoEtas
  ] = useState(true)


  const [etaSelecionada, setEtaSelecionada] =
    useState('')

  const [dataAnalise, setDataAnalise] =
    useState('')

  const [horaAnalise, setHoraAnalise] =
    useState('')

  const [vazaoEta, setVazaoEta] =
    useState('')


  // =========================
  // ETA
  // =========================

  const [cloroEta, setCloroEta] =
    useState('')

  const [fluorEta, setFluorEta] =
    useState('')

  const [phEta, setPhEta] =
    useState('')

  const [turbidezEta, setTurbidezEta] =
    useState('')

  const [corEta, setCorEta] =
    useState('')


  // =========================
  // REDE
  // =========================

  const [cloroRede, setCloroRede] =
    useState('')

  const [fluorRede, setFluorRede] =
    useState('')

  const [phRede, setPhRede] =
    useState('')

  const [turbidezRede, setTurbidezRede] =
    useState('')

  const [corRede, setCorRede] =
    useState('')


  const [observacoes, setObservacoes] =
    useState('')


  // =========================
  // REGISTROS
  // =========================

  const [
    analisesRegistradas,
    setAnalisesRegistradas
  ] = useState([])


  const [
    carregandoAnalises,
    setCarregandoAnalises
  ] = useState(true)


  const [
    relatorioIndividual,
    setRelatorioIndividual
  ] = useState(null)


  const [
    dataRelatorioGeral,
    setDataRelatorioGeral
  ] = useState('')


  const etaAtual =
    etas.find(
      (eta) =>
        eta.id === etaSelecionada
    )


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

          alert(
            'Não foi possível carregar as ETAs.'
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

        alert(
          'Não foi possível conectar ao banco de dados.'
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
                ascending: false
              }
            )


        if (error) {

          console.error(
            'Erro ao carregar análises:',
            error
          )

          setCarregandoAnalises(false)

          return
        }


        const registros =
          (data || []).map(
            (registro) =>
              formatarAnaliseBanco(
                registro
              )
          )


        setAnalisesRegistradas(
          registros
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar análises:',
          erro
        )

      } finally {

        setCarregandoAnalises(false)

      }

    }


    carregarAnalises()

  }, [])


  // =========================
  // LIMPAR CAMPOS
  // =========================

  function limparResultados() {

    setCloroEta('')
    setFluorEta('')
    setPhEta('')
    setTurbidezEta('')
    setCorEta('')

    setCloroRede('')
    setFluorRede('')
    setPhRede('')
    setTurbidezRede('')
    setCorRede('')

    setObservacoes('')

  }


  function alterarEta(event) {

    setEtaSelecionada(
      event.target.value
    )

    limparResultados()

  }


  // =========================
  // REGISTRAR ANÁLISE
  // =========================

  async function registrarAnalise() {

    if (!etaSelecionada) {

      alert(
        'Selecione uma ETA.'
      )

      return
    }


    if (!dataAnalise) {

      alert(
        'Informe a data da análise.'
      )

      return
    }


    if (!horaAnalise) {

      alert(
        'Informe o horário da análise.'
      )

      return
    }


    try {

      // =========================
      // ETA SELECIONADA
      // =========================

      if (!etaAtual?.bancoId) {

        alert(
          'Não foi possível localizar a ETA no banco de dados.'
        )

        return

      }


      // =========================
      // DATA E HORA
      // =========================

      const dataHora =
        new Date(
          `${dataAnalise}T${horaAnalise}:00`
        )


      // =========================
      // SALVAR
      // =========================

      const {
        data: analiseSalva,
        error: erroAnalise
      } =
        await supabase
          .from('analises')
          .insert({

            eta_id:
              etaAtual.bancoId,

            data_analise:
              dataHora.toISOString(),

            vazao_eta_m3_h:
              valorOuNull(
                vazaoEta
              ),


            // ETA

            cloro_residual_mg_l:
              valorOuNull(
                cloroEta
              ),

            fluor_mg_l:
              valorOuNull(
                fluorEta
              ),

            turbidez_ntu:
              valorOuNull(
                turbidezEta
              ),

            cor_eta_uh:
              valorOuNull(
                corEta
              ),

            ph:
              valorOuNull(
                phEta
              ),


            // REDE

            cloro_rede_mg_l:
              valorOuNull(
                cloroRede
              ),

            fluor_rede_mg_l:
              valorOuNull(
                fluorRede
              ),

            turbidez_rede_ntu:
              valorOuNull(
                turbidezRede
              ),

            cor_rede_uh:
              valorOuNull(
                corRede
              ),

            ph_rede:
              valorOuNull(
                phRede
              ),


            observacao:
              observacoes || null

          })
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
          .single()


      if (erroAnalise) {

        console.error(
          'Erro ao registrar análise:',
          erroAnalise
        )

        alert(
          'Não foi possível registrar a análise. O dado não foi salvo.'
        )

        return
      }


      const novaAnalise =
        formatarAnaliseBanco(
          analiseSalva
        )


      // =========================
      // ATUALIZAR TELA
      // =========================

      setAnalisesRegistradas(
        (registros) => [

          novaAnalise,

          ...registros

        ]
      )


      setRelatorioIndividual(
        novaAnalise
      )


      setDataRelatorioGeral(
        novaAnalise.data
      )


      alert(
        'Análise registrada com sucesso.'
      )


  } catch (erro) {

      console.error(
        'Erro inesperado ao registrar análise:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados. A análise não foi salva.'
      )

    }

  }


  // =========================
  // GERAR PNG INDIVIDUAL
  // =========================

  async function gerarPNGIndividual() {

    if (!relatorioIndividual) {

      alert(
        'Selecione uma análise primeiro.'
      )

      return
    }


    if (
      !relatorioIndividualRef.current
    ) {

      return
    }


    const canvas =
      await html2canvas(
        relatorioIndividualRef.current,
        {
          scale: 2,
          backgroundColor:
            '#ffffff',
          useCORS: true
        }
      )


    baixarCanvas(
      canvas,
      `analises-${relatorioIndividual.etaId}-${relatorioIndividual.data}.png`
    )

  }


  // =========================
  // DADOS DO RELATÓRIO GERAL
  // =========================

  function obterAnaliseEta(
    etaId
  ) {

    const registros =
      analisesRegistradas
        .filter(
          (analise) =>
            analise.etaId === etaId &&
            analise.data ===
              dataRelatorioGeral
        )
        .sort(
          (a, b) =>
            b.hora.localeCompare(
              a.hora
            )
        )


    return registros[0] || null

  }


  const relatorioGeral = {

    esplanada:
      obterAnaliseEta(
        'esplanada'
      ),

    torneiro:
      obterAnaliseEta(
        'torneiro'
      ),

    olhoDagua:
      obterAnaliseEta(
        'olho-dagua'
      ),

    campoBom:
      obterAnaliseEta(
        'campo-bom'
      )

  }


  const possuiAnaliseGeral =
    Object
      .values(
        relatorioGeral
      )
      .some(Boolean)


  // =========================
  // GERAR PNG GERAL
  // =========================

  async function gerarPNGGeral() {

    if (!dataRelatorioGeral) {

      alert(
        'Selecione a data do relatório.'
      )

      return
    }


    if (!possuiAnaliseGeral) {

      alert(
        'Não existem análises registradas nesta data.'
      )

      return
    }


    if (
      !relatorioGeralRef.current
    ) {

      return
    }


    const canvas =
      await html2canvas(
        relatorioGeralRef.current,
        {
          scale: 2.5,
          backgroundColor:
            '#ffffff',
          useCORS: true
        }
      )


    baixarCanvas(
      canvas,
      `analises-geral-${dataRelatorioGeral}.png`
    )

  }


  return (

    <div className="pagina-analises">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-analises">

        <div className="icone-analises">

          <ClipboardCheck size={27} />

        </div>


        <div>

          <h1>
            Análises
          </h1>

          <p>
            Registro das análises realizadas
            na ETA e na rede
          </p>

        </div>

      </div>


      {/* =========================
          DADOS DA ANÁLISE
      ========================= */}

      <div className="card-dados-analise">

        <div className="titulo-card-analise">

          <ClipboardCheck size={18} />

          <h2>
            Dados da análise
          </h2>

        </div>


        <div className="grid-dados-analise">


          <div className="campo-analise">

            <label>
              ETA
            </label>

            <select
              value={etaSelecionada}
              onChange={alterarEta}
              disabled={carregandoEtas}
            >

              <option value="">

                {carregandoEtas
                  ? 'Carregando ETAs...'
                  : 'Selecione uma ETA'
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


          <div className="campo-analise">

            <label>
              Data
            </label>

            <input
              type="date"
              value={dataAnalise}
              onChange={(e) =>
                setDataAnalise(
                  e.target.value
                )
              }
            />

          </div>


          <div className="campo-analise">

            <label>
              Horário
            </label>

            <input
              type="time"
              value={horaAnalise}
              onChange={(e) =>
                setHoraAnalise(
                  e.target.value
                )
              }
            />

          </div>


          <div className="campo-analise">

            <label>
              Vazão da ETA
            </label>

            <div className="input-unidade-analise">

              <input
                type="number"
                min="0"
                step="0.01"
                value={vazaoEta}
                onChange={(e) =>
                  setVazaoEta(
                    e.target.value
                  )
                }
                placeholder="0"
              />

              <span>
                m³/h
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =========================
          ETA / REDE
      ========================= */}

      {etaSelecionada && (

        <>


          <div className="grid-locais-analise">


            {/* ETA */}

            <div className="card-local-analise">

              <div className="cabecalho-local-analise">

                <div className="icone-local-analise">

                  <Droplets size={19} />

                </div>


                <div>

                  <h2>
                    ETA
                  </h2>

                  <span>
                    Água tratada na estação
                  </span>

                </div>

              </div>


              <CampoAnalise
                nome="Cloro"
                unidade="mg/L"
                valor={cloroEta}
                alterar={setCloroEta}
                exemplo="1.08"
              />


              <CampoAnalise
                nome="Flúor"
                unidade="mg/L"
                valor={fluorEta}
                alterar={setFluorEta}
                exemplo="0.81"
              />


              <CampoAnalise
                nome="Turbidez"
                unidade="uT"
                valor={turbidezEta}
                alterar={setTurbidezEta}
                exemplo="0.00"
              />


              <CampoAnalise
                nome="Cor"
                unidade="uH"
                valor={corEta}
                alterar={setCorEta}
                exemplo="0.0"
              />


              <CampoAnalise
                nome="pH"
                unidade=""
                valor={phEta}
                alterar={setPhEta}
                exemplo="7.76"
              />

            </div>


            {/* REDE */}

            <div className="card-local-analise">

              <div className="cabecalho-local-analise">

                <div className="icone-local-analise">

                  <MapPin size={19} />

                </div>


                <div>

                  <h2>
                    Rede
                  </h2>

                  <span>
                    Água analisada na rede
                  </span>

                </div>

              </div>


              <CampoAnalise
                nome="Cloro"
                unidade="mg/L"
                valor={cloroRede}
                alterar={setCloroRede}
                exemplo="0.94"
              />


              <CampoAnalise
                nome="Flúor"
                unidade="mg/L"
                valor={fluorRede}
                alterar={setFluorRede}
                exemplo="0.77"
              />


              <CampoAnalise
                nome="Turbidez"
                unidade="uT"
                valor={turbidezRede}
                alterar={setTurbidezRede}
                exemplo="0.00"
              />


              <CampoAnalise
                nome="Cor"
                unidade="uH"
                valor={corRede}
                alterar={setCorRede}
                exemplo="0.0"
              />


              <CampoAnalise
                nome="pH"
                unidade=""
                valor={phRede}
                alterar={setPhRede}
                exemplo="7.55"
              />

            </div>

          </div>


          {/* OBSERVAÇÕES */}

          <div className="card-observacoes-analise">

            <div className="campo-observacoes-analise">

              <label>
                Observações
              </label>

              <textarea
                value={observacoes}
                onChange={(e) =>
                  setObservacoes(
                    e.target.value
                  )
                }
                placeholder="Informações adicionais sobre a análise..."
              />

            </div>


            <button
              className="botao-registrar-analise"
              type="button"
              onClick={registrarAnalise}
            >

              <Save size={16} />

              Registrar análise

            </button>

          </div>

        </>

      )}


      {/* =========================
          ANÁLISES REGISTRADAS
      ========================= */}

      {carregandoAnalises && (

        <div className="card-historico-analises">

          <div className="titulo-card-analise">

            <ClipboardCheck size={18} />

            <h2>
              Análises registradas
            </h2>

          </div>


          <div className="lista-analises">

            Carregando análises...

          </div>

        </div>

      )}


      {!carregandoAnalises &&
       analisesRegistradas.length > 0 && (

        <div className="card-historico-analises">

          <div className="titulo-card-analise">

            <ClipboardCheck size={18} />

            <h2>
              Análises registradas
            </h2>

          </div>


          <div className="lista-analises">

            {analisesRegistradas.map(
              (analise) => (

                <button
                  type="button"
                  className="item-analise"
                  key={analise.id}
                  onClick={() =>
                    setRelatorioIndividual(
                      analise
                    )
                  }
                >

                  <div>

                    <strong>
                      ETA {analise.etaNome}
                    </strong>

                    <span>

                      {formatarData(
                        analise.data
                      )}

                      {' • '}

                      {analise.hora}

                    </span>

                  </div>


                  <span>

                    Cloro rede:{' '}

                    {formatarValor(
                      analise.rede.cloro
                    )}

                  </span>

                </button>

              )
            )}

          </div>

        </div>

      )}


      {/* =========================
          RELATÓRIO INDIVIDUAL
      ========================= */}

      {relatorioIndividual && (

        <div className="area-relatorio">

         <div className="topo-area-relatorio">

  <div>

    <span>
      RELATÓRIO INDIVIDUAL
    </span>

    <h2>
      Análises {relatorioIndividual.etaNome}
    </h2>

  </div>


  <div className="acoes-relatorio-individual">

    <button
      type="button"
      className="botao-fechar-relatorio"
      onClick={() =>
        setRelatorioIndividual(null)
      }
    >
      Fechar
    </button>


    <button
      type="button"
      className="botao-gerar-png"
      onClick={gerarPNGIndividual}
    >

      <ImageDown size={17} />

      Gerar PNG

    </button>

  </div>

</div>


          <div
            ref={relatorioIndividualRef}
            className="relatorio-individual-png"
          >

            <h1>

              ANÁLISES{' '}

              {relatorioIndividual
                .etaNome
                .toUpperCase()}

            </h1>


            <p className="data-individual">

              Data:{' '}

              <strong>

                {formatarData(
                  relatorioIndividual.data
                )}

              </strong>

            </p>


            <table className="tabela-individual">

              <thead>

                <tr>

                  <th>
                    PARÂMETRO
                  </th>

                  <th>
                    ETA
                  </th>

                  <th>
                    REDE
                  </th>

                </tr>

              </thead>


              <tbody>

                <LinhaIndividual
                  nome="Cloro"
                  eta={relatorioIndividual.eta.cloro}
                  rede={relatorioIndividual.rede.cloro}
                />

                <LinhaIndividual
                  nome="Flúor"
                  eta={relatorioIndividual.eta.fluor}
                  rede={relatorioIndividual.rede.fluor}
                />

                <LinhaIndividual
                  nome="Turbidez"
                  eta={relatorioIndividual.eta.turbidez}
                  rede={relatorioIndividual.rede.turbidez}
                />

                <LinhaIndividual
                  nome="Cor"
                  eta={relatorioIndividual.eta.cor}
                  rede={relatorioIndividual.rede.cor}
                />

                <LinhaIndividual
                  nome="pH"
                  eta={relatorioIndividual.eta.ph}
                  rede={relatorioIndividual.rede.ph}
                />

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =========================
          RELATÓRIO GERAL
      ========================= */}

      <div className="area-relatorio">

        <div className="topo-area-relatorio">

          <div>

            <span>
              RELATÓRIO GERAL
            </span>

            <h2>
              Todas as ETAs
            </h2>

          </div>


          <div className="acoes-relatorio-geral">

            <input
              type="date"
              value={dataRelatorioGeral}
              onChange={(e) =>
                setDataRelatorioGeral(
                  e.target.value
                )
              }
            />


            <button
              type="button"
              className="botao-gerar-png"
              onClick={gerarPNGGeral}
            >

              <ImageDown size={17} />

              Gerar PNG Geral

            </button>

          </div>

        </div>


        {dataRelatorioGeral && (

          <div
            ref={relatorioGeralRef}
            className="relatorio-geral-png"
          >


            <div className="data-geral">

              ANÁLISES DAS ETAs

              <span>

                {formatarData(
                  dataRelatorioGeral
                )}

              </span>

            </div>


            <table className="tabela-geral">


              <colgroup>

                <col style={{ width: '120px' }} />

                <col style={{ width: '67px' }} />
                <col style={{ width: '67px' }} />

                <col style={{ width: '67px' }} />
                <col style={{ width: '67px' }} />

                <col style={{ width: '67px' }} />
                <col style={{ width: '67px' }} />

                <col style={{ width: '67px' }} />
                <col style={{ width: '67px' }} />

              </colgroup>


              <thead>

                <tr>

                  <th
                    className="celula-analises"
                    rowSpan="3"
                  >
                    ANÁLISES
                  </th>


                  <th
                    className="titulo-pontos"
                    colSpan="8"
                  >
                    PONTOS DE COLETA
                  </th>

                </tr>


                <tr>

                  <th colSpan="2">
                    B. Esplanada
                  </th>

                  <th colSpan="2">
                    B. Torneiro
                  </th>

                  <th colSpan="2">
                    Olho D'água
                  </th>

                  <th colSpan="2">
                    B. Campo Bom
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

                <LinhaGeral
                  nome="CLORO"
                  parametro="cloro"
                  dados={relatorioGeral}
                />

                <LinhaGeral
                  nome="FLÚOR"
                  parametro="fluor"
                  dados={relatorioGeral}
                />

                <LinhaGeral
                  nome="TURBIDEZ"
                  parametro="turbidez"
                  dados={relatorioGeral}
                />

                <LinhaGeral
                  nome="COR"
                  parametro="cor"
                  dados={relatorioGeral}
                />

                <LinhaGeral
                  nome="PH"
                  parametro="ph"
                  dados={relatorioGeral}
                />

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  )

}


// =========================
// FORMATAR DADOS DO BANCO
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

    etaId:
      registro.etas?.slug || '',

    etaNome:
      registro.etas?.nome || '-',

    data,

    hora,

    vazaoEta:
      numeroOuNull(
        registro.vazao_eta_m3_h
      ),


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

    },


    observacoes:
      registro.observacao || ''

  }

}


// =========================
// CAMPO DE ANÁLISE
// =========================

function CampoAnalise({
  nome,
  unidade,
  valor,
  alterar,
  exemplo
}) {

  return (

    <div className="campo-parametro-analise">

      <label>
        {nome}
      </label>


      <div className="input-parametro-analise">

        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) =>
            alterar(
              e.target.value
            )
          }
          placeholder={`Ex.: ${exemplo}`}
        />


        {unidade && (

          <span>
            {unidade}
          </span>

        )}

      </div>

    </div>

  )

}


// =========================
// LINHA INDIVIDUAL
// =========================

function LinhaIndividual({
  nome,
  eta,
  rede
}) {

  return (

    <tr>

      <td>
        {nome}
      </td>

      <td>
        {formatarValor(eta)}
      </td>

      <td>
        {formatarValor(rede)}
      </td>

    </tr>

  )

}


// =========================
// LINHA RELATÓRIO GERAL
// =========================

function LinhaGeral({
  nome,
  parametro,
  dados
}) {

  return (

    <tr>

      <td className="nome-parametro-geral">
        {nome}
      </td>


      <ValorGeral
        analise={dados.esplanada}
        local="eta"
        parametro={parametro}
      />

      <ValorGeral
        analise={dados.esplanada}
        local="rede"
        parametro={parametro}
      />


      <ValorGeral
        analise={dados.torneiro}
        local="eta"
        parametro={parametro}
      />

      <ValorGeral
        analise={dados.torneiro}
        local="rede"
        parametro={parametro}
      />


      <ValorGeral
        analise={dados.olhoDagua}
        local="eta"
        parametro={parametro}
      />

      <ValorGeral
        analise={dados.olhoDagua}
        local="rede"
        parametro={parametro}
      />


      <ValorGeral
        analise={dados.campoBom}
        local="eta"
        parametro={parametro}
      />

      <ValorGeral
        analise={dados.campoBom}
        local="rede"
        parametro={parametro}
      />

    </tr>

  )

}


// =========================
// VALOR RELATÓRIO GERAL
// =========================

function ValorGeral({
  analise,
  local,
  parametro
}) {

  if (!analise) {

    return (

      <td className="valor-geral">
        -
      </td>

    )

  }


  const valor =
    analise?.[local]?.[parametro]


  return (

    <td className="valor-geral">

      {formatarValor(
        valor
      )}

    </td>

  )

}


// =========================
// FUNÇÕES AUXILIARES
// =========================

function valorOuNull(valor) {

  return valor !== ''
    ? Number(valor)
    : null

}


function numeroOuNull(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return null

  }


  return Number(valor)

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


function formatarData(data) {

  if (!data) {

    return '--'

  }


  const [
    ano,
    mes,
    dia
  ] = data.split('-')


  return `${dia}/${mes}/${ano}`

}


function baixarCanvas(
  canvas,
  nomeArquivo
) {

  const link =
    document.createElement('a')


  link.download =
    nomeArquivo


  link.href =
    canvas.toDataURL(
      'image/png'
    )


  link.click()

}


export default Analises