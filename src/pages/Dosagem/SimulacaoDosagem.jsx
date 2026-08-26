import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

import './SimulacaoDosagem.css'

function SimulacaoDosagem() {

  const navigate = useNavigate()
  const { id } = useParams()


  // =========================
  // DOSADORA + PRODUTO
  // DIRETAMENTE DO SUPABASE
  // =========================

  const [dosadoraAtual, setDosadoraAtual] =
    useState(null)

  const [produtoAtual, setProdutoAtual] =
    useState(null)

  const [carregandoDosadora, setCarregandoDosadora] =
    useState(true)


  useEffect(() => {

    async function carregarDosadora() {

      setCarregandoDosadora(true)

      try {

        const {
          data: dosadoraBanco,
          error: erroDosadora
        } =
          await supabase
            .from('dosadoras')
            .select(`
              id,
              codigo,
              eta_id,
              produto_id,
              nome,
              marca,
              pressao,
              capacidade_nominal,
              pulsacoes_disponiveis,
              ativa,

              produtos (
                id,
                nome,
                slug,
                concentracao,
                densidade,
                peso_galao,
                estado_fisico
              )
            `)
            .eq(
              'codigo',
              id
            )
            .maybeSingle()


        if (erroDosadora) {

          console.error(
            'Erro ao carregar dosadora:',
            erroDosadora
          )

          setDosadoraAtual(null)
          setProdutoAtual(null)
          return

        }


        if (!dosadoraBanco) {

          setDosadoraAtual(null)
          setProdutoAtual(null)
          return

        }


        const produto =
          dosadoraBanco.produtos


        const produtoLocalId =
          converterProdutoSlugParaLocal(
            produto?.slug
          )


        setDosadoraAtual({

          id:
            dosadoraBanco.codigo,

          bancoId:
            dosadoraBanco.id,

          etaBancoId:
            dosadoraBanco.eta_id,

          produtoBancoId:
            dosadoraBanco.produto_id,

          produtoId:
            produtoLocalId,

          nome:
            dosadoraBanco.nome,

          marca:
            dosadoraBanco.marca || '',

          pressao:
            dosadoraBanco.pressao !== null
              ? Number(
                  dosadoraBanco.pressao
                )
              : '',

          capacidadeNominal:
            dosadoraBanco.capacidade_nominal !== null
              ? Number(
                  dosadoraBanco.capacidade_nominal
                )
              : 0,

          pulsacoesDisponiveis:
            Array.isArray(
              dosadoraBanco.pulsacoes_disponiveis
            )
              ? dosadoraBanco
                  .pulsacoes_disponiveis
                  .map(Number)
              : []

        })


        setProdutoAtual(
          produto
            ? {

                id:
                  produtoLocalId,

                bancoId:
                  produto.id,

                slug:
                  produto.slug,

                nome:
                  produto.nome,

                concentracao:
                  produto.concentracao !== null
                    ? Number(
                        produto.concentracao
                      )
                    : 0,

                densidade:
                  produto.densidade !== null
                    ? Number(
                        produto.densidade
                      )
                    : 0,

                pesoGalao:
                  produto.peso_galao !== null
                    ? Number(
                        produto.peso_galao
                      )
                    : null,

                estadoFisico:
                  produto.estado_fisico ||
                  'Líquido'

              }
            : null
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar dosadora:',
          erro
        )

        setDosadoraAtual(null)
        setProdutoAtual(null)

      } finally {

        setCarregandoDosadora(false)

      }

    }


    carregarDosadora()

  }, [id])


  const [modo, setModo] =
    useState('ajuste')


  // =========================
  // AJUSTE DA DOSADORA
  // =========================

  const [cloroAtual, setCloroAtual] =
    useState('')

  const [cloroDesejado, setCloroDesejado] =
    useState('')

  const [pulsacaoAtual, setPulsacaoAtual] =
    useState('')

  const [cursorAtual, setCursorAtual] =
    useState('')


  // =========================
  // REFERÊNCIA OPERACIONAL
  // =========================

  const [
    vazaoEtaReferencia,
    setVazaoEtaReferencia
  ] = useState('')

  const [
    residualReferencia,
    setResidualReferencia
  ] = useState('')

  const [
    vazaoDosadoraReferencia,
    setVazaoDosadoraReferencia
  ] = useState('')

  const [
    aguaReferencia,
    setAguaReferencia
  ] = useState('')

  const [
    produtoReferencia,
    setProdutoReferencia
  ] = useState('')


  // =========================
  // CONDIÇÃO DESEJADA
  // =========================

  const [
    vazaoEtaDesejada,
    setVazaoEtaDesejada
  ] = useState('')

  const [
    residualDesejado,
    setResidualDesejado
  ] = useState('')

  const [
    vazaoDosadoraDesejada,
    setVazaoDosadoraDesejada
  ] = useState('')

  const [
    aguaDesejada,
    setAguaDesejada
  ] = useState('')


  // =========================
  // ESTIMAR VAZÃO
  // =========================

 const [aguaEstimativa, setAguaEstimativa] =
  useState('')

const [produtoEstimativa, setProdutoEstimativa] =
  useState('')

const [
  vazaoDosadoraEstimativa,
  setVazaoDosadoraEstimativa
] = useState('')

const [
  residualEstimativa,
  setResidualEstimativa
] = useState('')

// =========================
  // HISTÓRICO DO SUPABASE
  // =========================


const [
  historicoDosagens,
  setHistoricoDosagens
] = useState([])

const [
  carregandoHistorico,
  setCarregandoHistorico
] = useState(true)


// =========================
// CARREGAR HISTÓRICO REAL
// PREPAROS + ANÁLISES
// =========================

useEffect(() => {

  async function carregarHistoricoDosagens() {

    if (
      !dosadoraAtual ||
      !produtoAtual
    ) {

      setHistoricoDosagens([])
      setCarregandoHistorico(false)
      return

    }


    setCarregandoHistorico(true)


    try {

      // =========================
      // IDs DA DOSADORA CARREGADA
      // =========================

      const dosadoraBanco = {

        id:
          dosadoraAtual.bancoId,

        eta_id:
          dosadoraAtual.etaBancoId,

        produto_id:
          dosadoraAtual.produtoBancoId

      }


      // =========================
      // BUSCA PREPAROS REAIS
      // =========================

      const {
        data: preparos,
        error: erroPreparos
      } =
        await supabase
          .from('preparos_solucoes')
          .select(`
            id,
            eta_id,
            produto_id,
            dosadora_id,
            data_preparo,
            agua_l,
            produto_l,
            vazao_eta_m3_h,
            vazao_dosadora_l_h,
            cursor_percentual,
            pulsacao_percentual
          `)
          .eq(
            'dosadora_id',
            dosadoraBanco.id
          )
          .order(
            'data_preparo',
            {
              ascending: false
            }
          )


      if (erroPreparos) {

        console.error(
          'Erro ao carregar preparos:',
          erroPreparos
        )

        setHistoricoDosagens([])
        return

      }


      if (
        !preparos ||
        preparos.length === 0
      ) {

        setHistoricoDosagens([])
        return

      }


      // =========================
      // BUSCA ANÁLISES DA ETA
      // =========================

      const {
        data: analises,
        error: erroAnalises
      } =
        await supabase
          .from('analises')
          .select(`
            id,
            eta_id,
            data_analise,
            cloro_residual_mg_l,
            fluor_mg_l,
            ph
          `)
          .eq(
            'eta_id',
            dosadoraBanco.eta_id
          )
          .order(
            'data_analise',
            {
              ascending: true
            }
          )


      if (erroAnalises) {

        console.error(
          'Erro ao carregar análises:',
          erroAnalises
        )

        setHistoricoDosagens([])
        return

      }


      // =========================
      // RESULTADO ANALÍTICO
      // CONFORME O PRODUTO
      // =========================

      function obterResultadoAnalise(
        analise
      ) {

        if (
          produtoAtual.id ===
          'hipoclorito'
        ) {

          return analise
            .cloro_residual_mg_l

        }


        if (
          produtoAtual.id ===
          'fluor'
        ) {

          return analise
            .fluor_mg_l

        }


        if (
          produtoAtual.id ===
          'hidroxido'
        ) {

          return analise.ph

        }


        return null

      }


      // =========================
      // RELACIONA PREPARO
      // COM ANÁLISE
      // =========================

      const registrosFormatados =
        preparos
          .map(
            (preparo) => {

              const dataPreparo =
                new Date(
                  preparo.data_preparo
                )


              const dataPreparoTexto =
                dataPreparo
                  .toLocaleDateString(
                    'sv-SE'
                  )


              const analisesCompativeis =
                (analises || [])
                  .filter(
                    (analise) => {

                      const dataAnalise =
                        new Date(
                          analise.data_analise
                        )


                      const dataAnaliseTexto =
                        dataAnalise
                          .toLocaleDateString(
                            'sv-SE'
                          )


                      const mesmoDia =
                        dataAnaliseTexto ===
                        dataPreparoTexto


                      const depoisDoPreparo =
                        dataAnalise >=
                        dataPreparo


                      const resultado =
                        obterResultadoAnalise(
                          analise
                        )


                      const possuiResultado =
                        resultado !== null &&
                        resultado !== undefined &&
                        Number(resultado) > 0


                      return (
                        mesmoDia &&
                        depoisDoPreparo &&
                        possuiResultado
                      )

                    }
                  )


              if (
                analisesCompativeis
                  .length === 0
              ) {

                return null

              }


              // Usa a primeira análise
              // realizada após o preparo.

              const analiseReferencia =
                analisesCompativeis[0]


              const resultadoAnalise =
                Number(
                  obterResultadoAnalise(
                    analiseReferencia
                  )
                )


              // A referência só é válida
              // quando possui todos os dados
              // usados pelos cálculos.

              if (
                !preparo.vazao_eta_m3_h ||
                !preparo.vazao_dosadora_l_h ||
                !preparo.agua_l ||
                !preparo.produto_l ||
                resultadoAnalise <= 0
              ) {

                return null

              }


              return {

                id:
                  preparo.id,

                data:
                  dataPreparoTexto,

                produtoId:
                  produtoAtual.id,

                vazaoEta:
                  Number(
                    preparo.vazao_eta_m3_h
                  ),

                residualObtido:
                  resultadoAnalise,

                vazaoDosadora:
                  Number(
                    preparo.vazao_dosadora_l_h
                  ),

                agua:
                  Number(
                    preparo.agua_l
                  ),

                produto:
                  Number(
                    preparo.produto_l
                  ),

                pulsacao:
                  preparo
                    .pulsacao_percentual !==
                  null
                    ? Number(
                        preparo
                          .pulsacao_percentual
                      )
                    : null,

                cursor:
                  preparo
                    .cursor_percentual !==
                  null
                    ? Number(
                        preparo
                          .cursor_percentual
                      )
                    : null,

                dataAnalise:
                  analiseReferencia
                    .data_analise

              }

            }
          )
          .filter(Boolean)


      setHistoricoDosagens(
        registrosFormatados
      )


    } catch (erro) {

      console.error(
        'Erro inesperado ao montar histórico:',
        erro
      )

      setHistoricoDosagens([])

    } finally {

      setCarregandoHistorico(false)

    }

  }


  carregarHistoricoDosagens()

}, [
  dosadoraAtual,
  produtoAtual
])


  // =========================
  // CÁLCULOS
  // =========================

  const resultados = useMemo(() => {


    // =========================
    // AJUSTAR DOSADORA
    // =========================

    if (modo === 'ajuste') {

      const atual =
        Number(cloroAtual)

      const desejado =
        Number(cloroDesejado)

      const pulsacao =
        Number(pulsacaoAtual)

      const cursor =
        Number(cursorAtual)


      if (
        atual <= 0 ||
        desejado <= 0 ||
        pulsacao <= 0 ||
        cursor <= 0
      ) {
        return null
      }


      const fatorAjuste =
        desejado / atual


      // Primeiro tenta manter
      // a pulsação atual

      const novoCursor =
        cursor * fatorAjuste


      if (
        novoCursor >= 1 &&
        novoCursor <= 100
      ) {

        const percentualAlteracao =
          (
            (
              novoCursor -
              cursor
            ) /
            cursor
          ) * 100


        return {

          pulsacaoAtual:
            pulsacao,

          cursorAtual:
            cursor,

          pulsacaoSugerida:
            pulsacao,

          cursorSugerido:
            novoCursor,

          alterouPulsacao:
            false,

          percentualAlteracao

        }
      }


      // =========================
      // PROCURA OUTRA PULSAÇÃO
      // =========================

      const fatorAtual =
        (
          pulsacao /
          100
        ) *
        (
          cursor /
          100
        )


      const fatorNecessario =
        fatorAtual *
        fatorAjuste


      const combinacoes =
        dosadoraAtual
          ?.pulsacoesDisponiveis
          ?.map(
            (
              pulsacaoDisponivel
            ) => {

              const cursorNecessario =
                (
                  fatorNecessario /
                  (
                    pulsacaoDisponivel /
                    100
                  )
                ) *
                100


              return {

                pulsacao:
                  pulsacaoDisponivel,

                cursor:
                  cursorNecessario

              }

            }
          )
          .filter(
            (item) =>
              item.cursor >= 1 &&
              item.cursor <= 100
          ) || []


      if (
        combinacoes.length === 0
      ) {

        return {
          semCombinacao: true
        }
      }


      const melhorCombinacao =
        combinacoes.reduce(
          (
            melhor,
            atual
          ) => {

            const diferencaMelhor =
              Math.abs(
                melhor.cursor -
                cursor
              )

            const diferencaAtual =
              Math.abs(
                atual.cursor -
                cursor
              )


            return diferencaAtual <
              diferencaMelhor
              ? atual
              : melhor

          }
        )


      const percentualAlteracao =
        (
          (
            fatorNecessario -
            fatorAtual
          ) /
          fatorAtual
        ) * 100


      return {

        pulsacaoAtual:
          pulsacao,

        cursorAtual:
          cursor,

        pulsacaoSugerida:
          melhorCombinacao.pulsacao,

        cursorSugerido:
          melhorCombinacao.cursor,

        alterouPulsacao:
          melhorCombinacao.pulsacao !==
          pulsacao,

        percentualAlteracao

      }

    }


    // =========================
    // SIMULAÇÃO POR REFERÊNCIA
    // =========================

 if (modo === 'dosagem') {

  const etaDesejada =
    Number(vazaoEtaDesejada)

  const residualFinal =
    Number(residualDesejado)

  const dosadoraDesejada =
    Number(vazaoDosadoraDesejada)

  const aguaFinal =
    Number(aguaDesejada)


  if (
    etaDesejada <= 0 ||
    residualFinal <= 0 ||
    dosadoraDesejada <= 0 ||
    aguaFinal <= 0
  ) {

    return null
  }


  // =========================
  // HISTÓRICO DO PRODUTO
  // =========================

  const historicoProduto =
    historicoDosagens.filter(
      (registro) =>
        registro.produtoId ===
        produtoAtual?.id
    )


  if (historicoProduto.length === 0) {

    return {
      semHistorico: true
    }

  }


  // =========================
  // ENCONTRA A REFERÊNCIA
  // MAIS PARECIDA
  // =========================

  const referencias =
    historicoProduto.map(
      (registro) => {

        const diferencaEta =
          Math.abs(
            registro.vazaoEta -
            etaDesejada
          ) / etaDesejada


        const diferencaResidual =
          Math.abs(
            registro.residualObtido -
            residualFinal
          ) / residualFinal


        const diferencaDosadora =
          Math.abs(
            registro.vazaoDosadora -
            dosadoraDesejada
          ) / dosadoraDesejada


        const pontuacao =
          diferencaEta +
          diferencaResidual +
          diferencaDosadora


        return {

          ...registro,

          pontuacao

        }

      }
    )


  const melhorReferencia =
    referencias.reduce(
      (melhor, atual) =>
        atual.pontuacao <
        melhor.pontuacao
          ? atual
          : melhor
    )

    // =========================
// CONFIANÇA DA REFERÊNCIA
// =========================

const limiteConfianca = 0.50

if (
  melhorReferencia.pontuacao >
  limiteConfianca
) {

  return {
    semReferenciaConfiavel: true,
    melhorReferencia
  }

}

  // =========================
  // DADOS DA REFERÊNCIA
  // =========================

  const etaRef =
    melhorReferencia.vazaoEta

  const residualRef =
    melhorReferencia.residualObtido

  const dosadoraRef =
    melhorReferencia.vazaoDosadora

  const aguaRef =
    melhorReferencia.agua

  const produtoRef =
    melhorReferencia.produto


  // =========================
  // PROPORÇÃO HISTÓRICA
  // =========================

  const proporcaoReferencia =
    produtoRef / aguaRef


  // =========================
  // CORREÇÕES
  // =========================

  const fatorResidual =
    residualFinal / residualRef


  const fatorEta =
    etaDesejada / etaRef


  const fatorDosadora =
    dosadoraRef /
    dosadoraDesejada


  // =========================
  // NOVA PROPORÇÃO
  // =========================

  const proporcaoNecessaria =
    proporcaoReferencia *
    fatorResidual *
    fatorEta *
    fatorDosadora


  // =========================
  // PRODUTO NECESSÁRIO
  // =========================

  const produtoNecessario =
    aguaFinal *
    proporcaoNecessaria


  const volumeFinal =
    aguaFinal +
    produtoNecessario


  const percentualVariacao =
    (
      (
        proporcaoNecessaria -
        proporcaoReferencia
      ) /
      proporcaoReferencia
    ) * 100


  return {

    referencia:
      melhorReferencia,

    proporcaoReferencia,

    proporcaoNecessaria,

    produtoNecessario,

    aguaFinal,

    volumeFinal,

    percentualVariacao,

    fatorResidual,

    fatorEta,

    fatorDosadora

  }

}


    // =========================
    // ESTIMAR VAZÃO DA ETA
    // =========================

    if (modo === 'vazao') {

  const agua =
    Number(aguaEstimativa)

  const produto =
    Number(produtoEstimativa)

  const dosadora =
    Number(vazaoDosadoraEstimativa)

  const residual =
    Number(residualEstimativa)


  if (
    agua <= 0 ||
    produto <= 0 ||
    dosadora <= 0 ||
    residual <= 0
  ) {

    return null
  }


  // =========================
  // HISTÓRICO DO PRODUTO
  // =========================

  const historicoProduto =
    historicoDosagens.filter(
      (registro) =>
        registro.produtoId ===
        produtoAtual?.id
    )


  if (historicoProduto.length === 0) {

    return {
      semHistoricoVazao: true
    }

  }


  // =========================
  // PROPORÇÃO DO PREPARO ATUAL
  // =========================

  const proporcaoAtual =
    produto / agua


  // =========================
  // COMPARA COM O HISTÓRICO
  // =========================

  const referencias =
    historicoProduto.map(
      (registro) => {

        const proporcaoHistorica =
          registro.produto /
          registro.agua


        const diferencaSolucao =
          Math.abs(
            proporcaoHistorica -
            proporcaoAtual
          ) /
          proporcaoAtual


        const diferencaDosadora =
          Math.abs(
            registro.vazaoDosadora -
            dosadora
          ) /
          dosadora


        const diferencaResidual =
          Math.abs(
            registro.residualObtido -
            residual
          ) /
          residual


        const pontuacao =
          diferencaSolucao +
          diferencaDosadora +
          diferencaResidual


        return {

          ...registro,

          proporcaoHistorica,

          pontuacao

        }

      }
    )


  // =========================
  // MELHOR REFERÊNCIA
  // =========================

  const melhorReferencia =
    referencias.reduce(
      (melhor, atual) =>
        atual.pontuacao <
        melhor.pontuacao
          ? atual
          : melhor
    )


  // =========================
  // LIMITE DE CONFIANÇA
  // =========================

  const limiteConfianca = 0.50


  if (
    melhorReferencia.pontuacao >
    limiteConfianca
  ) {

    return {

      semReferenciaVazao: true,

      melhorReferencia

    }

  }


  // =========================
  // VAZÃO ESTIMADA
  // =========================

  return {

    vazaoEstimada:
      melhorReferencia.vazaoEta,

    referenciaVazao:
      melhorReferencia,

    proporcaoAtual

  }

}
    return null

  }, [

    modo,

    cloroAtual,
    cloroDesejado,

    pulsacaoAtual,
    cursorAtual,

    dosadoraAtual,

    vazaoEtaReferencia,
    residualReferencia,
    vazaoDosadoraReferencia,
    aguaReferencia,
    produtoReferencia,

    vazaoEtaDesejada,
    residualDesejado,
    vazaoDosadoraDesejada,
    aguaDesejada,

    aguaEstimativa,
    produtoEstimativa,
    vazaoDosadoraEstimativa,
    residualEstimativa,
    produtoAtual,
    historicoDosagens

  ])


  // =========================
  // CARREGANDO DOSADORA
  // =========================

  if (carregandoDosadora) {

    return (

      <div className="simulacao-pagina">

        <div className="simulacao-topo">

          <div>

            <span className="simulacao-subtitulo">
              DOSAGEM
            </span>

            <h1>
              Simulação de Dosagem
            </h1>

            <p>
              Carregando dados da dosadora...
            </p>

          </div>

        </div>

      </div>

    )

  }


  // =========================
  // DOSADORA NÃO ENCONTRADA
  // =========================

  if (!dosadoraAtual) {

    return (

      <div>

        <h1>
          Dosadora não encontrada
        </h1>

      </div>

    )

  }


  return (

    <div className="simulacao-pagina">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="simulacao-topo">

        <div>

          <span className="simulacao-subtitulo">
            DOSAGEM
          </span>

          <h1>
            Simulação de Dosagem
          </h1>

          <p>
            Ajuste e simule condições de operação
            da dosadora.
          </p>

        </div>


        <button
          className="botao-voltar"
          onClick={() =>
            navigate(
              `/dosagem?dosadora=${id}`
            )
          }
        >

          ← Voltar

        </button>

      </div>


      {/* =========================
          SELETOR
      ========================= */}

      <div className="simulacao-seletor">


        <button
          className={
            modo === 'ajuste'
              ? 'ativo'
              : ''
          }
          onClick={() =>
            setModo('ajuste')
          }
        >

          Ajustar dosadora

        </button>


        <button
          className={
            modo === 'dosagem'
              ? 'ativo'
              : ''
          }
          onClick={() =>
            setModo('dosagem')
          }
        >

          Dosagem necessária

        </button>


        <button
          className={
            modo === 'vazao'
              ? 'ativo'
              : ''
          }
          onClick={() =>
            setModo('vazao')
          }
        >

          Estimar vazão da ETA

        </button>

      </div>


      {/* =========================
          AJUSTAR DOSADORA
      ========================= */}

      {modo === 'ajuste' && (

        <div className="simulacao-card">


          <h2>
            Ajuste da dosadora
          </h2>


          <p className="descricao-card">
             Informe a solução utilizada, a vazão real
             da dosadora e o cloro residual medido.
             O sistema buscará no histórico uma condição
            operacional semelhante para estimar a vazão da ETA.
          </p>


          <div className="simulacao-grid">


            <div className="campo">

              <label>
                Cloro residual atual
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="0.01"
                  value={cloroAtual}
                  onChange={(e) =>
                    setCloroAtual(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 1.40"
                />

                <span>
                  mg/L
                </span>

              </div>

            </div>


            <div className="campo">

              <label>
                Cloro residual desejado
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="0.01"
                  value={cloroDesejado}
                  onChange={(e) =>
                    setCloroDesejado(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 0.85"
                />

                <span>
                  mg/L
                </span>

              </div>

            </div>


            <div className="campo">

              <label>
                Pulsação atual
              </label>

              <select
                value={pulsacaoAtual}
                onChange={(e) =>
                  setPulsacaoAtual(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Selecione
                </option>

                {dosadoraAtual
                  .pulsacoesDisponiveis
                  .map(
                    (valor) => (

                      <option
                        key={valor}
                        value={valor}
                      >

                        {valor}%

                      </option>

                    )
                  )
                }

              </select>

            </div>


            <div className="campo">

              <label>
                Cursor atual
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={cursorAtual}
                  onChange={(e) =>
                    setCursorAtual(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 60"
                />

                <span>
                  %
                </span>

              </div>

            </div>

          </div>


          {resultados && (

            <div className="resultado-card">


              {resultados.semCombinacao ? (

                <>

                  <span className="resultado-titulo">
                    Ajuste não encontrado
                  </span>

                  <div className="resultado-principal">

                    <strong>
                      Sem combinação válida
                    </strong>

                    <span>
                      O ajuste necessário está fora
                      das configurações disponíveis
                      desta dosadora.
                    </span>

                  </div>

                </>

              ) : (

                <>

                  <span className="resultado-titulo">
                    Ajuste sugerido
                  </span>


                  <div className="resultado-principal">

                    <strong>

                      Cursor{' '}

                      {resultados
                        .cursorSugerido
                        .toFixed(1)}
                      %

                    </strong>

                    <span>

                      Pulsação{' '}

                      {resultados
                        .pulsacaoSugerida}
                      %

                    </span>

                  </div>


                  <div className="resultado-detalhes">


                    <div>

                      <span>
                        Configuração atual
                      </span>

                      <strong>

                        Pulsação{' '}
                        {resultados.pulsacaoAtual}%

                        {' • '}

                        Cursor{' '}
                        {resultados.cursorAtual}%

                      </strong>

                    </div>


                    <div>

                      <span>
                        Configuração sugerida
                      </span>

                      <strong>

                        Pulsação{' '}
                        {resultados.pulsacaoSugerida}%

                        {' • '}

                        Cursor{' '}

                        {resultados
                          .cursorSugerido
                          .toFixed(1)}
                        %

                      </strong>

                    </div>


                    <div>

                      <span>
                        Alteração estimada
                      </span>

                      <strong>

                        {resultados
                          .percentualAlteracao < 0
                          ? 'Reduzir '
                          : 'Aumentar '
                        }

                        {Math.abs(
                          resultados
                            .percentualAlteracao
                        ).toFixed(1)}
                        %

                      </strong>

                    </div>

                  </div>


                  <p className="resultado-aviso">

                    {resultados.alterouPulsacao
                      ? (
                        <>
                          Ajustar a pulsação para{' '}
                          <strong>
                            {resultados
                              .pulsacaoSugerida}%
                          </strong>
                          {' '}e o cursor para
                          aproximadamente{' '}
                          <strong>
                            {resultados
                              .cursorSugerido
                              .toFixed(1)}%
                          </strong>.
                        </>
                      )
                      : (
                        <>
                          Manter a pulsação em{' '}
                          <strong>
                            {resultados
                              .pulsacaoSugerida}%
                          </strong>
                          {' '}e ajustar o cursor para
                          aproximadamente{' '}
                          <strong>
                            {resultados
                              .cursorSugerido
                              .toFixed(1)}%
                          </strong>.
                        </>
                      )
                    }

                    {' '}

                    Realize uma nova análise de cloro
                    residual após o ajuste.

                  </p>

                </>

              )}

            </div>

          )}

        </div>

      )}


      {/* =========================
          DOSAGEM NECESSÁRIA
      ========================= */}

      {modo === 'dosagem' && (

        <div className="simulacao-card">


          <h2>
  Simulação baseada no histórico
</h2>

<p className="descricao-card">
  Informe a condição desejada de operação.
  O sistema buscará automaticamente no histórico
  a condição mais próxima para calcular a proporção
  sugerida de água e produto.
</p>


          {/* =========================
              REFERÊNCIA
          ========================= */}

          <h3 className="titulo-grupo-simulacao">
  Referência operacional encontrada
</h3>


{carregandoHistorico && (

  <div className="aviso-referencia">

    <strong>
      Carregando histórico
    </strong>

    <span>
      Buscando preparos e análises registrados no Supabase.
    </span>

  </div>

)}


{!carregandoHistorico && resultados?.semHistorico && (

  <div className="aviso-referencia">

    <strong>
      Histórico insuficiente
    </strong>

    <span>
      Ainda não existem preparos com análise posterior e
      todos os dados necessários para usar como referência.
    </span>

  </div>

)}


{resultados?.semReferenciaConfiavel && (

  <div className="aviso-referencia">

    <strong>
      Referência insuficiente
    </strong>

    <span>
      Não foi encontrada no histórico uma
      condição suficientemente próxima da
      operação desejada.
    </span>

    <span>
      Informe outra condição ou utilize uma
      referência operacional conhecida.
    </span>

  </div>

)}


{resultados?.referencia && (

  <div className="referencia-historico">

    <div>

      <span>
        Data
      </span>

      <strong>
  {new Date(
    `${resultados.referencia.data}T00:00:00`
  ).toLocaleDateString('pt-BR')}
</strong>

    </div>


    <div>

      <span>
        Vazão da ETA
      </span>

      <strong>
        {resultados.referencia.vazaoEta} m³/h
      </strong>

    </div>


    <div>

      <span>
        Cloro obtido
      </span>

      <strong>
        {resultados.referencia.residualObtido} mg/L
      </strong>

    </div>


    <div>

      <span>
        Vazão da dosadora
      </span>

      <strong>
        {resultados.referencia.vazaoDosadora} L/h
      </strong>

    </div>


    <div>

      <span>
        Preparo utilizado
      </span>

      <strong>

        {resultados.referencia.produto} L produto
        {' + '}
        {resultados.referencia.agua} L água

      </strong>

    </div>

  </div>

)}

          {/* =========================
              CONDIÇÃO DESEJADA
          ========================= */}

          <h3 className="titulo-grupo-simulacao">
            Condição desejada
          </h3>


          <div className="simulacao-grid">


            <div className="campo">

              <label>
                Vazão da ETA
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="0.01"
                  value={vazaoEtaDesejada}
                  onChange={(e) =>
                    setVazaoEtaDesejada(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 7"
                />

                <span>
                  m³/h
                </span>

              </div>

            </div>


            <div className="campo">

              <label>
                Cloro residual desejado
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="0.01"
                  value={residualDesejado}
                  onChange={(e) =>
                    setResidualDesejado(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 0.85"
                />

                <span>
                  mg/L
                </span>

              </div>

            </div>


            <div className="campo">

              <label>
                Vazão real da dosadora
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="0.01"
                  value={vazaoDosadoraDesejada}
                  onChange={(e) =>
                    setVazaoDosadoraDesejada(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 5"
                />

                <span>
                  L/h
                </span>

              </div>

            </div>


            <div className="campo">

              <label>
                Água que deseja utilizar
              </label>

              <div className="campo-unidade">

                <input
                  type="number"
                  step="1"
                  value={aguaDesejada}
                  onChange={(e) =>
                    setAguaDesejada(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 100"
                />

                <span>
                  L
                </span>

              </div>

            </div>

          </div>


          {/* =========================
              RESULTADO
          ========================= */}

          {resultados?.produtoNecessario !== undefined && (

            <div className="resultado-card">

              <span className="resultado-titulo">
                Preparo sugerido
              </span>


              <div className="resultado-principal">

                <strong>

                  {resultados
                    .produtoNecessario
                    .toFixed(1)}
                  {' '}L de produto

                </strong>

                <span>

                  para{' '}

                  <strong>

                    {resultados
                      .aguaFinal
                      .toFixed(1)}
                    {' '}L de água

                  </strong>

                </span>

              </div>


              <div className="resultado-detalhes">


                <div>

                  <span>
                    Água
                  </span>

                  <strong>

                    {resultados
                      .aguaFinal
                      .toFixed(1)}
                    {' '}L

                  </strong>

                </div>


                <div>

                  <span>
                    Produto
                  </span>

                  <strong>

                    {resultados
                      .produtoNecessario
                      .toFixed(2)}
                    {' '}L

                  </strong>

                </div>


                <div>

                  <span>
                    Volume final aproximado
                  </span>

                  <strong>

                    {resultados
                      .volumeFinal
                      .toFixed(1)}
                    {' '}L

                  </strong>

                </div>


                <div>

                  <span>
                    Alteração da proporção
                  </span>

                  <strong>

                    {resultados.percentualVariacao > 0
                      ? 'Aumentar '
                      : resultados.percentualVariacao < 0
                        ? 'Reduzir '
                        : 'Manter '
                    }

                    {Math.abs(
                      resultados
                        .percentualVariacao
                    ).toFixed(1)}
                    %

                  </strong>

                </div>

              </div>


              <p className="resultado-aviso">

                Esta simulação utiliza a condição
                operacional informada como referência.
                Após qualquer alteração, confirme o
                resultado realizando nova análise de
                cloro residual.

              </p>

            </div>

          )}

        </div>

      )}


      {/* =========================
          ESTIMAR VAZÃO
      ========================= */}

      {modo === 'vazao' && (

        <div className="simulacao-card">


          <h2>
            Estimar vazão da ETA
          </h2>


          <p className="descricao-card">

            Utilize os dados da solução e da dosadora
            para obter uma estimativa da vazão de água
            tratada.

          </p>


          <div className="simulacao-grid">

  <div className="campo">

    <label>
      Água utilizada
    </label>

    <div className="campo-unidade">

      <input
        type="number"
        min="0"
        step="1"
        value={aguaEstimativa}
        onChange={(e) =>
          setAguaEstimativa(
            e.target.value
          )
        }
        placeholder="Ex.: 100"
      />

      <span>
        L
      </span>

    </div>

  </div>


  <div className="campo">

    <label>
      Produto utilizado
    </label>

    <div className="campo-unidade">

      <input
        type="number"
        min="0"
        step="0.1"
        value={produtoEstimativa}
        onChange={(e) =>
          setProdutoEstimativa(
            e.target.value
          )
        }
        placeholder="Ex.: 8"
      />

      <span>
        L
      </span>

    </div>

  </div>


  <div className="campo">

    <label>
      Vazão real da dosadora
    </label>

    <div className="campo-unidade">

      <input
        type="number"
        min="0"
        step="0.01"
        value={vazaoDosadoraEstimativa}
        onChange={(e) =>
          setVazaoDosadoraEstimativa(
            e.target.value
          )
        }
        placeholder="Ex.: 5"
      />

      <span>
        L/h
      </span>

    </div>

  </div>


  <div className="campo">

    <label>
      Cloro residual medido
    </label>

    <div className="campo-unidade">

      <input
        type="number"
        min="0"
        step="0.01"
        value={residualEstimativa}
        onChange={(e) =>
          setResidualEstimativa(
            e.target.value
          )
        }
        placeholder="Ex.: 0.85"
      />

      <span>
        mg/L
      </span>

    </div>

  </div>

</div>


          {/* =========================
    RESULTADO DA ESTIMATIVA
========================= */}


{/* SEM HISTÓRICO */}

{carregandoHistorico && (

  <div className="aviso-referencia">

    <strong>
      Carregando histórico
    </strong>

    <span>
      Buscando preparos e análises registrados no Supabase.
    </span>

  </div>

)}


{resultados?.semHistoricoVazao && (

  <div className="aviso-referencia">

    <strong>
      Histórico insuficiente
    </strong>

    <span>
      Ainda não existem registros históricos
      deste produto para estimar a vazão da ETA.
    </span>

  </div>

)}


{/* REFERÊNCIA INSUFICIENTE */}

{resultados?.semReferenciaVazao && (

  <div className="aviso-referencia">

    <strong>
      Referência insuficiente
    </strong>

    <span>
      Não foi encontrada no histórico uma
      condição operacional suficientemente
      próxima dos dados informados.
    </span>

    <span>
      A vazão da ETA não será estimada com
      base em uma referência pouco confiável.
    </span>

  </div>

)}


{/* VAZÃO ESTIMADA */}

{resultados?.vazaoEstimada !== undefined && (

  <div className="resultado-card">

    <span className="resultado-titulo">
      Vazão estimada da ETA
    </span>


    <div className="resultado-principal">

      <strong>

        {resultados
          .vazaoEstimada
          .toFixed(2)}

        {' '}m³/h

      </strong>

      <span>
        Estimativa baseada no histórico operacional
      </span>

    </div>


    {/* REFERÊNCIA UTILIZADA */}

    {resultados.referenciaVazao && (

      <div className="resultado-detalhes">


        <div>

          <span>
            Referência
          </span>

          <strong>

            {new Date(
              `${resultados.referenciaVazao.data}T00:00:00`
            ).toLocaleDateString('pt-BR')}

          </strong>

        </div>


        <div>

          <span>
            Vazão registrada
          </span>

          <strong>
            {resultados.referenciaVazao.vazaoEta} m³/h
          </strong>

        </div>


        <div>

          <span>
            Solução da referência
          </span>

          <strong>

            {resultados.referenciaVazao.produto} L produto

            {' + '}

            {resultados.referenciaVazao.agua} L água

          </strong>

        </div>


        <div>

          <span>
            Cloro residual
          </span>

          <strong>
            {resultados.referenciaVazao.residualObtido} mg/L
          </strong>

        </div>


        <div>

          <span>
            Vazão da dosadora
          </span>

          <strong>
            {resultados.referenciaVazao.vazaoDosadora} L/h
          </strong>

        </div>


      </div>

    )}


    <p className="resultado-aviso">

      A vazão apresentada é uma estimativa baseada
      em uma condição operacional semelhante registrada
      no histórico. Ela não representa uma medição direta
      da vazão da ETA.

    </p>

  </div>

)}

        </div>

      )}

    </div>

  )

}


// =========================
// SLUG DO BANCO → ID USADO
// PELOS CÁLCULOS ATUAIS
// =========================

function converterProdutoSlugParaLocal(
  slug
) {

  if (
    slug ===
    'acido-fluossilicico'
  ) {

    return 'fluor'

  }


  if (
    slug ===
    'hidroxido-sodio'
  ) {

    return 'hidroxido'

  }


  return slug || ''

}


export default SimulacaoDosagem