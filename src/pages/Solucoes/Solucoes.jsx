import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  FlaskConical,
  Droplets,
  Calculator,
  Save,
  History
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Solucoes.css'


function Solucoes() {

  // =========================
  // DADOS DO SUPABASE
  // =========================

  const [etas, setEtas] =
    useState([])

  const [produtos, setProdutos] =
    useState([])

  const [dosadoras, setDosadoras] =
    useState([])

  const [
    carregandoCadastros,
    setCarregandoCadastros
  ] = useState(true)


  const [etaSelecionada, setEtaSelecionada] =
    useState('')

  const [produtoSelecionado, setProdutoSelecionado] =
    useState('')

  const [agua, setAgua] =
    useState('')

  const [produto, setProduto] =
    useState('')

  const [vazaoEta, setVazaoEta] =
    useState('')

  const [vazaoDosadora, setVazaoDosadora] =
    useState('')

  const [cursor, setCursor] =
    useState('')

  const [pulsacao, setPulsacao] =
    useState('')

  const [dataPreparo, setDataPreparo] =
    useState('')

  const [horaPreparo, setHoraPreparo] =
    useState('')


  // =========================
  // HISTÓRICO
  // =========================

  const [
    historicoSolucoes,
    setHistoricoSolucoes
  ] = useState([])

  const [
    carregandoHistorico,
    setCarregandoHistorico
  ] = useState(true)


  // =========================
  // CARREGAR CADASTROS
  // DO SUPABASE
  // =========================

  useEffect(() => {

    async function carregarCadastros() {

      setCarregandoCadastros(true)

      try {

        const [
          respostaEtas,
          respostaProdutos,
          respostaDosadoras
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
              slug,
              concentracao,
              densidade,
              peso_galao,
              estado_fisico
            `)
            .order(
              'nome',
              {
                ascending: true
              }
            ),

          supabase
            .from('dosadoras')
            .select(`
              id,
              codigo,
              nome,
              marca,
              pressao,
              capacidade_nominal,
              pulsacoes_disponiveis,
              ativa,

              etas (
                slug,
                nome
              ),

              produtos (
                slug,
                nome
              )
            `)
            .eq(
              'ativa',
              true
            )
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

          alert(
            'Não foi possível carregar as ETAs.'
          )

          return
        }


        if (respostaProdutos.error) {

          console.error(
            'Erro ao carregar produtos:',
            respostaProdutos.error
          )

          alert(
            'Não foi possível carregar os produtos.'
          )

          return
        }


        if (respostaDosadoras.error) {

          console.error(
            'Erro ao carregar dosadoras:',
            respostaDosadoras.error
          )

          alert(
            'Não foi possível carregar as dosadoras.'
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


                      const produtoLocal =
                        produtosFormatados.find(
                          (item) =>
                            item.slug ===
                            produto.slug
                        )


                      produtosEta.set(
                        produto.id,
                        produtoLocal || {

                          id:
                            converterProdutoSlugParaLocal(
                              produto.slug
                            ),

                          bancoId:
                            produto.id,

                          slug:
                            produto.slug,

                          nome:
                            produto.nome

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


        const dosadorasFormatadas =
          (respostaDosadoras.data || [])
            .map(
              (dosadora) => ({

                id:
                  dosadora.codigo,

                bancoId:
                  dosadora.id,

                etaId:
                  dosadora.etas?.slug || '',

                produtoId:
                  converterProdutoSlugParaLocal(
                    dosadora.produtos?.slug
                  ),

                nome:
                  dosadora.nome,

                marca:
                  dosadora.marca || '',

                pressao:
                  dosadora.pressao !== null
                    ? Number(
                        dosadora.pressao
                      )
                    : '',

                capacidadeNominal:
                  dosadora.capacidade_nominal !== null
                    ? Number(
                        dosadora.capacidade_nominal
                      )
                    : 0,

                pulsacoesDisponiveis:
                  Array.isArray(
                    dosadora.pulsacoes_disponiveis
                  )
                    ? dosadora
                        .pulsacoes_disponiveis
                        .map(Number)
                    : []

              })
            )


        setProdutos(
          produtosFormatados
        )

        setEtas(
          etasFormatadas
        )

        setDosadoras(
          dosadorasFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar cadastros:',
          erro
        )

        alert(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregandoCadastros(false)

      }

    }


    carregarCadastros()

  }, [])


  // =========================
  // DADOS SELECIONADOS
  // =========================

  const etaAtual =
    etas.find(
      (eta) =>
        eta.id === etaSelecionada
    )


  const produtoAtualEta =
    etaAtual?.produtos.find(
      (item) =>
        item.id === produtoSelecionado
    )


  const produtoCadastrado =
    produtos.find(
      (item) =>
        item.id === produtoSelecionado
    )


  const dosadoraAtual =
    dosadoras.find(
      (item) =>
        item.etaId === etaSelecionada &&
        item.produtoId === produtoSelecionado
    )


  // =========================
  // CARREGAR PREPAROS
  // =========================

  useEffect(() => {

    async function carregarPreparos() {

      setCarregandoHistorico(true)


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('preparos_solucoes')
            .select(`
              id,
              data_preparo,
              agua_l,
              produto_l,
              volume_final_l,
              concentracao_produto_percentual,
              densidade_produto_kg_l,
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
              ),

              dosadoras (
                codigo,
                nome
              )
            `)
            .order(
              'data_preparo',
              {
                ascending: false
              }
            )


        if (error) {

          console.error(
            'Erro ao carregar preparos:',
            error
          )

          return
        }


        const registrosFormatados =
          (data || []).map(
            (registro) =>
              formatarPreparoBanco(
                registro
              )
          )


        setHistoricoSolucoes(
          registrosFormatados
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar preparos:',
          erro
        )

      } finally {

        setCarregandoHistorico(false)

      }

    }


    carregarPreparos()

  }, [])


  // =========================
  // CÁLCULO DA SOLUÇÃO
  // =========================

  const resultado =
    useMemo(() => {

      const aguaNumero =
        Number(agua)

      const produtoNumero =
        Number(produto)


      if (
        aguaNumero < 0 ||
        produtoNumero < 0
      ) {

        return null

      }


      const volumeFinal =
        aguaNumero +
        produtoNumero


      const percentualProdutoNaSolucao =
        volumeFinal > 0
          ? (
              produtoNumero /
              volumeFinal
            ) * 100
          : 0


      const concentracaoProduto =
        Number(
          produtoCadastrado?.concentracao ||
          0
        )


      const densidadeProduto =
        Number(
          produtoCadastrado?.densidade ||
          0
        )


      const massaProduto =
        produtoNumero *
        densidadeProduto


      return {

        volumeFinal,

        percentualProdutoNaSolucao,

        concentracaoProduto,

        densidadeProduto,

        massaProduto

      }

    }, [
      agua,
      produto,
      produtoCadastrado
    ])


  // =========================
  // ALTERAR ETA
  // =========================

  function alterarEta(event) {

    setEtaSelecionada(
      event.target.value
    )

    setProdutoSelecionado('')

    setCursor('')
    setPulsacao('')

    limparCampos()

  }


  // =========================
  // ALTERAR PRODUTO
  // =========================

  function alterarProduto(event) {

    setProdutoSelecionado(
      event.target.value
    )

    limparCampos()

  }


  // =========================
  // LIMPAR CAMPOS
  // =========================

  function limparCampos() {

    setAgua('')
    setProduto('')

    setVazaoEta('')
    setVazaoDosadora('')

    setCursor('')
    setPulsacao('')

    setDataPreparo('')
    setHoraPreparo('')

  }


  // =========================
  // REGISTRAR SOLUÇÃO
  // =========================

  async function registrarSolucao() {

    if (!etaSelecionada) {

      alert(
        'Selecione uma ETA.'
      )

      return

    }


    if (!produtoSelecionado) {

      alert(
        'Selecione um produto.'
      )

      return

    }


    if (
      Number(agua) <= 0
    ) {

      alert(
        'Informe a quantidade de água utilizada.'
      )

      return

    }


    if (
      Number(produto) <= 0
    ) {

      alert(
        'Informe a quantidade de produto utilizado.'
      )

      return

    }


    if (!dataPreparo) {

      alert(
        'Informe a data do preparo.'
      )

      return

    }


    if (!horaPreparo) {

      alert(
        'Informe o horário do preparo.'
      )

      return

    }


    if (!resultado) {

      alert(
        'Não foi possível calcular o preparo.'
      )

      return

    }


    try {

      // =========================
      // IDs REAIS DO SUPABASE
      // =========================

      const etaBancoId =
        etaAtual?.bancoId


      const produtoBancoId =
        produtoCadastrado?.bancoId


      const dosadoraBancoId =
        dosadoraAtual?.bancoId ||
        null


      if (
        !etaBancoId ||
        !produtoBancoId
      ) {

        alert(
          'Não foi possível localizar a ETA ou o produto no banco de dados.'
        )

        return

      }


      // =========================
      // DATA E HORA
      // =========================

      const dataHora =
        new Date(
          `${dataPreparo}T${horaPreparo}:00`
        )


      // =========================
      // SALVAR NO SUPABASE
      // =========================

      const {
        data: registroSalvo,
        error: erroRegistro
      } =
        await supabase
          .from('preparos_solucoes')
          .insert({

            eta_id:
              etaBancoId,

            produto_id:
              produtoBancoId,

            dosadora_id:
              dosadoraBancoId,

            data_preparo:
              dataHora.toISOString(),

            agua_l:
              Number(agua),

            produto_l:
              Number(produto),

            volume_final_l:
              Number(
                resultado.volumeFinal
              ),

            concentracao_produto_percentual:
              Number(
                produtoCadastrado
                  ?.concentracao ||
                0
              ),

            densidade_produto_kg_l:
              Number(
                produtoCadastrado
                  ?.densidade ||
                0
              ),

            vazao_eta_m3_h:
              valorPositivoOuNull(
                vazaoEta
              ),

            vazao_dosadora_l_h:
              valorPositivoOuNull(
                vazaoDosadora
              ),

            cursor_percentual:
              valorPositivoOuNull(
                cursor
              ),

            pulsacao_percentual:
              valorPositivoOuNull(
                pulsacao
              )

          })
          .select(`
            id,
            data_preparo,
            agua_l,
            produto_l,
            volume_final_l,
            concentracao_produto_percentual,
            densidade_produto_kg_l,
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
            ),

            dosadoras (
              codigo,
              nome
            )
          `)
          .single()


      if (erroRegistro) {

        console.error(
          'Erro ao registrar solução:',
          erroRegistro
        )

        alert(
          'Não foi possível registrar a solução preparada.'
        )

        return

      }


      // =========================
      // ATUALIZAR HISTÓRICO
      // =========================

      const novoRegistro =
        formatarPreparoBanco(
          registroSalvo
        )


      setHistoricoSolucoes(
        (historicoAtual) => [

          novoRegistro,

          ...historicoAtual

        ]
      )


      alert(
        'Solução registrada com sucesso.'
      )


      setAgua('')
      setProduto('')

      setVazaoEta('')
      setVazaoDosadora('')

      setCursor('')
      setPulsacao('')


    } catch (erro) {

      console.error(
        'Erro inesperado ao registrar solução:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados.'
      )

    }

  }


  if (carregandoCadastros) {

    return (

      <div className="pagina-solucoes">

        <div className="cabecalho-solucoes">

          <div className="icone-solucoes">
            <FlaskConical size={28} />
          </div>

          <div>

            <h1>
              Soluções
            </h1>

            <p>
              Carregando cadastros...
            </p>

          </div>

        </div>

      </div>

    )

  }


  return (

    <div className="pagina-solucoes">


      {/* CABEÇALHO */}

      <div className="cabecalho-solucoes">

        <div className="icone-solucoes">

          <FlaskConical size={28} />

        </div>


        <div>

          <h1>
            Soluções
          </h1>

          <p>
            Preparo e controle das soluções utilizadas nas ETAs
          </p>

        </div>

      </div>


      {/* SELEÇÃO */}

      <div className="card-selecao-solucao">


        <div className="campo-solucao">

          <label>
            ETA
          </label>

          <select
            value={etaSelecionada}
            onChange={alterarEta}
          >

            <option value="">
              Selecione uma ETA
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


        <div className="campo-solucao">

          <label>
            Produto
          </label>

          <select
            value={produtoSelecionado}
            onChange={alterarProduto}
            disabled={!etaSelecionada}
          >

            <option value="">
              Selecione um produto
            </option>


            {etaAtual?.produtos.map(
              (item) => (

                <option
                  key={item.id}
                  value={item.id}
                >

                  {item.nome}

                </option>

              )
            )}

          </select>

        </div>

      </div>


      {produtoSelecionado && (

        <>


          <div className="grid-calculo-solucao">


            {/* PREPARO */}

            <div className="card-calculo">

              <div className="titulo-card-calculo">

                <FlaskConical size={19} />

                <h2>
                  Preparo da solução
                </h2>

              </div>


              <div className="produto-selecionado">

                <span>
                  Produto selecionado
                </span>

                <strong>
                  {produtoAtualEta?.nome}
                </strong>

              </div>


              <div className="campo-calculo">

                <label>
                  Água adicionada
                </label>

                <div className="input-unidade">

                  <input
                    type="number"
                    min="0"
                    value={agua}
                    onChange={(e) =>
                      setAgua(
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />

                  <span>
                    L
                  </span>

                </div>

              </div>


              <div className="campo-calculo">

                <label>
                  Produto adicionado
                </label>

                <div className="input-unidade">

                  <input
                    type="number"
                    min="0"
                    value={produto}
                    onChange={(e) =>
                      setProduto(
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />

                  <span>
                    L
                  </span>

                </div>

              </div>


              <div className="produto-selecionado">

                <span>
                  Concentração cadastrada
                </span>

                <strong>

                  {produtoCadastrado
                    ? `${produtoCadastrado.concentracao}%`
                    : '--'
                  }

                </strong>

              </div>


              <div className="produto-selecionado">

                <span>
                  Densidade cadastrada
                </span>

                <strong>

                  {produtoCadastrado
                    ? `${Number(
                        produtoCadastrado.densidade
                      ).toFixed(2)} kg/L`
                    : '--'
                  }

                </strong>

              </div>

            </div>


            {/* RESULTADOS */}

            <div className="card-calculo">

              <div className="titulo-card-calculo">

                <Calculator size={19} />

                <h2>
                  Resultado do preparo
                </h2>

              </div>


              <div className="resultado-solucao">

                <span>
                  Volume final da solução
                </span>

                <strong>

                  {resultado
                    ? `${resultado.volumeFinal.toFixed(1)} L`
                    : '--'
                  }

                </strong>

              </div>


              <div className="resultado-solucao">

                <span>
                  Produto na solução
                </span>

                <strong>

                  {resultado
                    ? `${resultado.percentualProdutoNaSolucao.toFixed(2)}%`
                    : '--'
                  }

                </strong>

              </div>


              <div className="resultado-solucao">

                <span>
                  Massa aproximada de produto
                </span>

                <strong>

                  {resultado
                    ? `${resultado.massaProduto.toFixed(2)} kg`
                    : '--'
                  }

                </strong>

              </div>


              <div className="separador-solucao"></div>


              <div className="titulo-card-calculo titulo-referencia">

                <Droplets size={18} />

                <h2>
                  Condições no momento do preparo
                </h2>

              </div>


              <div className="campo-calculo">

                <label>
                  Vazão da ETA
                </label>

                <div className="input-unidade">

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
                    placeholder="Opcional"
                  />

                  <span>
                    m³/h
                  </span>

                </div>

              </div>


              <div className="campo-calculo">

                <label>
                  Vazão real da dosadora
                </label>

                <div className="input-unidade">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vazaoDosadora}
                    onChange={(e) =>
                      setVazaoDosadora(
                        e.target.value
                      )
                    }
                    placeholder="Opcional"
                  />

                  <span>
                    L/h
                  </span>

                </div>

              </div>


              <div className="campo-calculo">

                <label>
                  Cursor da dosadora
                </label>

                <div className="input-unidade">

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={cursor}
                    onChange={(e) =>
                      setCursor(
                        e.target.value
                      )
                    }
                    placeholder="Opcional"
                  />

                  <span>
                    %
                  </span>

                </div>

              </div>


              <div className="campo-calculo">

                <label>
                  Pulsação da dosadora
                </label>

                <div className="input-unidade">

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={pulsacao}
                    onChange={(e) =>
                      setPulsacao(
                        e.target.value
                      )
                    }
                    placeholder="Opcional"
                  />

                  <span>
                    %
                  </span>

                </div>

              </div>


              <div className="campo-calculo">

                <label>
                  Data do preparo
                </label>

                <input
                  type="date"
                  value={dataPreparo}
                  onChange={(e) =>
                    setDataPreparo(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="campo-calculo">

                <label>
                  Horário do preparo
                </label>

                <input
                  type="time"
                  value={horaPreparo}
                  onChange={(e) =>
                    setHoraPreparo(
                      e.target.value
                    )
                  }
                />

              </div>


              <button
                className="botao-registrar-solucao"
                type="button"
                onClick={registrarSolucao}
              >

                <Save size={16} />

                Registrar solução preparada

              </button>

            </div>

          </div>


          {/* HISTÓRICO */}

          <div className="card-historico-solucoes">

            <div className="titulo-card-calculo">

              <History size={19} />

              <h2>
                Soluções registradas
              </h2>

            </div>


            {carregandoHistorico ? (

              <p className="historico-solucao-vazio">
                Carregando soluções...
              </p>

            ) : historicoSolucoes.length === 0 ? (

              <p className="historico-solucao-vazio">
                Nenhuma solução registrada.
              </p>

            ) : (

              <div className="tabela-historico-solucoes-wrapper">

                <table className="tabela-historico-solucoes">

                  <thead>

                    <tr>

                      <th>ETA</th>
                      <th>Produto</th>
                      <th>Preparo</th>
                      <th>Volume final</th>
                      <th>Vazão ETA</th>
                      <th>Vazão dosadora</th>
                      <th>Cursor</th>
                      <th>Pulsação</th>
                      <th>Data</th>

                    </tr>

                  </thead>


                  <tbody>

                    {historicoSolucoes.map(
                      (registro) => (

                        <tr key={registro.id}>

                          <td>
                            {registro.etaNome}
                          </td>


                          <td className="coluna-produto-historico">
                            {registro.produtoNome}
                          </td>


                          <td>

                            {registro.agua} L água

                            <br />

                            {registro.produto} L produto

                          </td>


                          <td>
                            {registro.volumeFinal.toFixed(1)} L
                          </td>


                          <td>

                            {registro.vazaoEta > 0
                              ? `${registro.vazaoEta} m³/h`
                              : '--'
                            }

                          </td>


                          <td>

                            {registro.vazaoDosadora > 0
                              ? `${registro.vazaoDosadora} L/h`
                              : '--'
                            }

                          </td>


                          <td>

                            {registro.cursor > 0
                              ? `${registro.cursor}%`
                              : '--'
                            }

                          </td>


                          <td>

                            {registro.pulsacao > 0
                              ? `${registro.pulsacao}%`
                              : '--'
                            }

                          </td>


                          <td>

                            {formatarData(
                              registro.dataPreparo
                            )}

                            <br />

                            {registro.horaPreparo}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </>

      )}

    </div>

  )

}


// =========================
// FORMATAR PREPARO DO BANCO
// =========================

function formatarPreparoBanco(
  registro
) {

  const dataHora =
    new Date(
      registro.data_preparo
    )


  const dataPreparo =
    dataHora.toLocaleDateString(
      'sv-SE'
    )


  const horaPreparo =
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

    produtoId:
      converterProdutoSlugParaLocal(
        registro.produtos?.slug
      ),

    produtoNome:
      registro.produtos?.nome || '-',

    dosadoraId:
      registro.dosadoras?.codigo || null,

    agua:
      numeroOuZero(
        registro.agua_l
      ),

    produto:
      numeroOuZero(
        registro.produto_l
      ),

    volumeFinal:
      numeroOuZero(
        registro.volume_final_l
      ),

    concentracaoProduto:
      numeroOuZero(
        registro
          .concentracao_produto_percentual
      ),

    densidadeProduto:
      numeroOuZero(
        registro
          .densidade_produto_kg_l
      ),

    vazaoEta:
      numeroOuZero(
        registro.vazao_eta_m3_h
      ),

    vazaoDosadora:
      numeroOuZero(
        registro.vazao_dosadora_l_h
      ),

    cursor:
      numeroOuZero(
        registro.cursor_percentual
      ),

    pulsacao:
      numeroOuZero(
        registro.pulsacao_percentual
      ),

    dataPreparo,

    horaPreparo

  }

}


// =========================
// PRODUTO BANCO → LOCAL
// =========================

function converterProdutoSlugParaLocal(
  slug
) {

  if (slug === 'acido-fluossilicico') {
    return 'fluor'
  }

  if (slug === 'hidroxido-sodio') {
    return 'hidroxido'
  }

  return slug || ''

}


// =========================
// AUXILIARES
// =========================

function valorPositivoOuNull(
  valor
) {

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {

    return null

  }


  const numero =
    Number(valor)


  return numero > 0
    ? numero
    : null

}


function numeroOuZero(
  valor
) {

  if (
    valor === null ||
    valor === undefined
  ) {

    return 0

  }


  return Number(valor)

}


function formatarData(
  data
) {

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


export default Solucoes