import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Gauge,
  Plus,
  Pencil,
  Trash2,
  X,
  Save
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './CadastroDosadoras.css'


function CadastroDosadoras() {

  const navigate = useNavigate()


  // =========================
  // DADOS
  // =========================

  const [dosadoras, setDosadoras] =
    useState([])

  const [etas, setEtas] =
    useState([])

  const [carregando, setCarregando] =
    useState(true)


  // =========================
  // FORMULÁRIO
  // =========================

  const [formAberto, setFormAberto] =
    useState(false)

  const [editandoId, setEditandoId] =
    useState(null)

  const [nome, setNome] =
    useState('')

  const [etaId, setEtaId] =
    useState('')

  const [produtoId, setProdutoId] =
    useState('')

  const [marca, setMarca] =
    useState('')

  const [pressao, setPressao] =
    useState('')

  const [
    capacidadeNominal,
    setCapacidadeNominal
  ] = useState('')

  const [pulsacoes, setPulsacoes] =
    useState([])

  const [salvando, setSalvando] =
    useState(false)


  // =========================
  // CARREGAR DADOS
  // =========================

  useEffect(() => {

    carregarDados()

  }, [])


  async function carregarDados() {

    setCarregando(true)


    try {

      // =========================
      // ETAs + PRODUTOS
      // =========================

      const {
        data: etasBanco,
        error: erroEtas
      } =
        await supabase
          .from('etas')
          .select(`
            id,
            nome,
            slug,

            reservatorios (
              id,

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
          )


      if (erroEtas) {

        console.error(
          'Erro ao carregar ETAs:',
          erroEtas
        )

        alert(
          'Não foi possível carregar as ETAs.'
        )

        return

      }


      const etasFormatadas =
        (etasBanco || []).map(
          (eta) => {

            const produtosMap =
              new Map()


            ;(eta.reservatorios || [])
              .forEach(
                (reservatorio) => {

                  const produto =
                    reservatorio.produtos


                  if (produto) {

                    produtosMap.set(
                      produto.id,
                      produto
                    )

                  }

                }
              )


            return {

              id:
                eta.id,

              nome:
                eta.nome,

              slug:
                eta.slug,

              produtos:
                Array.from(
                  produtosMap.values()
                )
                  .sort(
                    (a, b) =>
                      a.nome.localeCompare(
                        b.nome
                      )
                  )

            }

          }
        )


      setEtas(
        etasFormatadas
      )


      // =========================
      // DOSADORAS
      // =========================

      const {
        data: dosadorasBanco,
        error: erroDosadoras
      } =
        await supabase
          .from('dosadoras')
          .select(`
            id,
            codigo,
            nome,
            marca,
            pressao,
            capacidade_nominal,
            unidade_capacidade,
            pulsacoes_disponiveis,
            ativa,

            etas (
              id,
              nome,
              slug
            ),

            produtos (
              id,
              nome,
              slug
            )
          `)
          .order(
            'nome',
            {
              ascending: true
            }
          )


      if (erroDosadoras) {

        console.error(
          'Erro ao carregar dosadoras:',
          erroDosadoras
        )

        alert(
          'Não foi possível carregar as dosadoras.'
        )

        return

      }


      const dosadorasFormatadas =
        (dosadorasBanco || []).map(
          (dosadora) => ({

            id:
              dosadora.id,

            codigo:
              dosadora.codigo,

            nome:
              dosadora.nome,

            etaId:
              dosadora.etas?.id || '',

            etaNome:
              dosadora.etas?.nome || '-',

            etaSlug:
              dosadora.etas?.slug || '',

            produtoId:
              dosadora.produtos?.id || '',

            produtoNome:
              dosadora.produtos?.nome || '-',

            produtoSlug:
              dosadora.produtos?.slug || '',

            marca:
              dosadora.marca || '',

            pressao:
              dosadora.pressao !== null
                ? Number(
                    dosadora.pressao
                  )
                : null,

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
                : [],

            ativa:
              dosadora.ativa !== false

          })
        )


      setDosadoras(
        dosadorasFormatadas
      )


    } catch (erro) {

      console.error(
        'Erro inesperado:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados.'
      )

    } finally {

      setCarregando(false)

    }

  }


  // =========================
  // ETA SELECIONADA
  // =========================

  const etaSelecionada =
    etas.find(
      (eta) =>
        eta.id === etaId
    )


  // =========================
  // LIMPAR
  // =========================

  function limparFormulario() {

    setNome('')
    setEtaId('')
    setProdutoId('')
    setMarca('')
    setPressao('')
    setCapacidadeNominal('')
    setPulsacoes([])

    setEditandoId(null)

  }


  // =========================
  // NOVA DOSADORA
  // =========================

  function abrirNovaDosadora() {

    limparFormulario()

    setFormAberto(true)

  }


  // =========================
  // EDITAR
  // =========================

  function editarDosadora(
    dosadora
  ) {

    setEditandoId(
      dosadora.id
    )

    setNome(
      dosadora.nome || ''
    )

    setEtaId(
      dosadora.etaId || ''
    )

    setProdutoId(
      dosadora.produtoId || ''
    )

    setMarca(
      dosadora.marca || ''
    )

    setPressao(
      dosadora.pressao ?? ''
    )

    setCapacidadeNominal(
      dosadora.capacidadeNominal ??
      ''
    )

    setPulsacoes(
      dosadora
        .pulsacoesDisponiveis ||
      []
    )

    setFormAberto(true)

  }


  // =========================
  // FECHAR
  // =========================

  function fecharFormulario() {

    setFormAberto(false)

    limparFormulario()

  }


  // =========================
  // PULSAÇÕES
  // =========================

  function alternarPulsacao(
    valor
  ) {

    if (
      pulsacoes.includes(valor)
    ) {

      setPulsacoes(
        pulsacoes.filter(
          (item) =>
            item !== valor
        )
      )

    } else {

      setPulsacoes(
        [
          ...pulsacoes,
          valor
        ].sort(
          (a, b) =>
            a - b
        )
      )

    }

  }


  // =========================
  // SALVAR
  // =========================

  async function salvarDosadora() {

    if (
      !nome.trim() ||
      !etaId ||
      !produtoId
    ) {

      alert(
        'Preencha nome, ETA e produto.'
      )

      return

    }


    if (
      Number(capacidadeNominal) <= 0
    ) {

      alert(
        'Informe uma capacidade nominal válida.'
      )

      return

    }


    if (
      pulsacoes.length === 0
    ) {

      alert(
        'Selecione pelo menos uma pulsação.'
      )

      return

    }


    const eta =
      etas.find(
        (item) =>
          item.id === etaId
      )


    const produto =
      eta?.produtos.find(
        (item) =>
          item.id === produtoId
      )


    if (
      !eta ||
      !produto
    ) {

      alert(
        'ETA ou produto inválido.'
      )

      return

    }


    setSalvando(true)


    try {

      // =========================
      // EDITAR
      // =========================

      if (editandoId) {

        const {
          error
        } =
          await supabase
            .from('dosadoras')
            .update({

              nome:
                nome.trim(),

              eta_id:
                etaId,

              produto_id:
                produtoId,

              marca:
                marca.trim() ||
                null,

              pressao:
                valorOuNull(
                  pressao
                ),

              capacidade_nominal:
                Number(
                  capacidadeNominal
                ),

              unidade_capacidade:
                'L/h',

              pulsacoes_disponiveis:
                pulsacoes

            })
            .eq(
              'id',
              editandoId
            )


        if (error) {

          console.error(
            'Erro ao editar dosadora:',
            error
          )

          alert(
            'Não foi possível editar a dosadora.'
          )

          return

        }


        alert(
          'Dosadora atualizada com sucesso.'
        )

      }

      // =========================
      // NOVA
      // =========================

      else {

        const codigo =
          criarCodigoDosadora(
            eta.slug,
            produto.slug
          )


        const {
          error
        } =
          await supabase
            .from('dosadoras')
            .insert({

              codigo,

              nome:
                nome.trim(),

              eta_id:
                etaId,

              produto_id:
                produtoId,

              marca:
                marca.trim() ||
                null,

              pressao:
                valorOuNull(
                  pressao
                ),

              capacidade_nominal:
                Number(
                  capacidadeNominal
                ),

              unidade_capacidade:
                'L/h',

              pulsacoes_disponiveis:
                pulsacoes,

              ativa:
                true

            })


        if (error) {

          console.error(
            'Erro ao cadastrar dosadora:',
            error
          )


          if (
            error.code === '23505'
          ) {

            alert(
              'Já existe uma dosadora cadastrada com este identificador.'
            )

          } else {

            alert(
              'Não foi possível cadastrar a dosadora.'
            )

          }

          return

        }


        alert(
          'Dosadora cadastrada com sucesso.'
        )

      }


      fecharFormulario()

      await carregarDados()


    } catch (erro) {

      console.error(
        'Erro inesperado ao salvar dosadora:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados.'
      )

    } finally {

      setSalvando(false)

    }

  }


  // =========================
  // EXCLUIR
  // =========================

  async function excluirDosadora(
    dosadora
  ) {

    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${dosadora.nome}"?`
      )


    if (!confirmar) {
      return
    }


    try {

      const {
        error
      } =
        await supabase
          .from('dosadoras')
          .delete()
          .eq(
            'id',
            dosadora.id
          )


      if (error) {

        console.error(
          'Erro ao excluir dosadora:',
          error
        )


        if (
          error.code === '23503'
        ) {

          alert(
            'Esta dosadora não pode ser excluída porque já possui calibrações, preparos ou outros registros vinculados.'
          )

        } else {

          alert(
            'Não foi possível excluir a dosadora.'
          )

        }

        return

      }


      setDosadoras(
        (listaAtual) =>
          listaAtual.filter(
            (item) =>
              item.id !==
              dosadora.id
          )
      )


      alert(
        'Dosadora excluída com sucesso.'
      )


    } catch (erro) {

      console.error(
        'Erro inesperado ao excluir dosadora:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados.'
      )

    }

  }


  return (

    <div className="pagina-cadastro-dosadoras">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-cadastro-dosadoras">

        <div className="titulo-cadastro-dosadoras">

          <button
            className="botao-voltar-dosadoras"
            onClick={() =>
              navigate('/cadastros')
            }
          >

            <ArrowLeft size={18} />

            Voltar

          </button>


          <div>

            <span>
              CADASTROS
            </span>

            <h1>
              Dosadoras
            </h1>

            <p>
              Equipamentos utilizados na dosagem
              dos produtos das ETAs.
            </p>

          </div>

        </div>


        <button
          className="botao-nova-dosadora"
          type="button"
          onClick={abrirNovaDosadora}
        >

          <Plus size={17} />

          Nova dosadora

        </button>

      </div>


      {/* =========================
          FORMULÁRIO
      ========================= */}

      {formAberto && (

        <div className="formulario-dosadora">

          <div className="topo-formulario-dosadora">

            <h2>

              {editandoId
                ? 'Editar dosadora'
                : 'Nova dosadora'
              }

            </h2>


            <button
              type="button"
              onClick={fecharFormulario}
            >

              <X size={18} />

            </button>

          </div>


          <div className="grid-formulario-dosadora">


            <div className="campo-formulario">

              <label>
                Nome da dosadora
              </label>

              <input
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                placeholder="Ex.: Dosadora Hipoclorito - Torneiro"
              />

            </div>


            <div className="campo-formulario">

              <label>
                ETA
              </label>

              <select
                value={etaId}
                onChange={(e) => {

                  setEtaId(
                    e.target.value
                  )

                  setProdutoId('')

                }}
              >

                <option value="">
                  Selecione
                </option>


                {etas.map(
                  (eta) => (

                    <option
                      key={eta.id}
                      value={eta.id}
                    >

                      {eta.nome}

                    </option>

                  )
                )}

              </select>

            </div>


            <div className="campo-formulario">

              <label>
                Produto
              </label>

              <select
                value={produtoId}
                disabled={!etaId}
                onChange={(e) =>
                  setProdutoId(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Selecione
                </option>


                {etaSelecionada
                  ?.produtos
                  ?.map(
                    (produto) => (

                      <option
                        key={produto.id}
                        value={produto.id}
                      >

                        {produto.nome}

                      </option>

                    )
                  )
                }

              </select>

            </div>


            <div className="campo-formulario">

              <label>
                Marca
              </label>

              <input
                value={marca}
                onChange={(e) =>
                  setMarca(
                    e.target.value
                  )
                }
                placeholder="Opcional"
              />

            </div>


            <div className="campo-formulario">

              <label>
                Pressão
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={pressao}
                onChange={(e) =>
                  setPressao(
                    e.target.value
                  )
                }
                placeholder="Opcional"
              />

            </div>


            <div className="campo-formulario">

              <label>
                Capacidade nominal
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={capacidadeNominal}
                onChange={(e) =>
                  setCapacidadeNominal(
                    e.target.value
                  )
                }
                placeholder="Ex.: 5"
              />

            </div>

          </div>


          {/* =========================
              PULSAÇÕES
          ========================= */}

          <div className="grupo-pulsacoes">

            <label>
              Pulsações disponíveis
            </label>


            <div className="opcoes-pulsacoes">

              {[25, 50, 75, 100].map(
                (valor) => (

                  <button
                    type="button"
                    key={valor}
                    className={
                      pulsacoes.includes(
                        valor
                      )
                        ? 'pulsacao-ativa'
                        : ''
                    }
                    onClick={() =>
                      alternarPulsacao(
                        valor
                      )
                    }
                  >

                    {valor}%

                  </button>

                )
              )}

            </div>

          </div>


          <button
            className="botao-salvar-dosadora"
            type="button"
            onClick={salvarDosadora}
            disabled={salvando}
          >

            <Save size={16} />

            {salvando
              ? 'Salvando...'
              : 'Salvar dosadora'
            }

          </button>

        </div>

      )}


      {/* =========================
          LISTA
      ========================= */}

      <div className="grid-cadastro-dosadoras">


        {carregando ? (

          <p>
            Carregando dosadoras...
          </p>

        ) : dosadoras.length === 0 ? (

          <p>
            Nenhuma dosadora cadastrada.
          </p>

        ) : (

          dosadoras.map(
            (dosadora) => (

              <div
                className="card-cadastro-dosadora"
                key={dosadora.id}
              >


                <div className="topo-card-cadastro-dosadora">

                  <div className="icone-cadastro-dosadora">

                    <Gauge size={22} />

                  </div>


                  <div className="acoes-dosadora">


                    <button
                      className="botao-editar-dosadora"
                      type="button"
                      title="Editar dosadora"
                      onClick={() =>
                        editarDosadora(
                          dosadora
                        )
                      }
                    >

                      <Pencil size={16} />

                    </button>


                    <button
                      className="botao-excluir-dosadora"
                      type="button"
                      title="Excluir dosadora"
                      onClick={() =>
                        excluirDosadora(
                          dosadora
                        )
                      }
                    >

                      <Trash2 size={16} />

                    </button>


                  </div>

                </div>


                <h2>
                  {dosadora.nome}
                </h2>


                <div className="dados-cadastro-dosadora">


                  <div>

                    <span>
                      ETA
                    </span>

                    <strong>
                      {dosadora.etaNome}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Produto
                    </span>

                    <strong>
                      {dosadora.produtoNome}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Capacidade nominal
                    </span>

                    <strong>

                      {dosadora.capacidadeNominal}
                      {' '}L/h

                    </strong>

                  </div>


                  <div>

                    <span>
                      Marca
                    </span>

                    <strong>
                      {dosadora.marca || '--'}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Pressão
                    </span>

                    <strong>

                      {dosadora.pressao !== null
                        ? `${dosadora.pressao} bar`
                        : '--'
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Pulsações
                    </span>

                    <strong>

                      {dosadora
                        .pulsacoesDisponiveis
                        ?.length > 0
                        ? dosadora
                            .pulsacoesDisponiveis
                            .map(
                              (valor) =>
                                `${valor}%`
                            )
                            .join(' • ')
                        : '--'
                      }

                    </strong>

                  </div>


                </div>

              </div>

            )
          )

        )}


      </div>

    </div>

  )

}


// =========================
// VALOR OU NULL
// =========================

function valorOuNull(
  valor
) {

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {

    return null

  }


  return Number(valor)

}


// =========================
// CÓDIGO DA DOSADORA
// =========================

function criarCodigoDosadora(
  etaSlug,
  produtoSlug
) {

  let produtoCodigo =
    produtoSlug


  if (
    produtoSlug ===
    'acido-fluossilicico'
  ) {

    produtoCodigo =
      'fluor'

  }


  if (
    produtoSlug ===
    'hidroxido-sodio'
  ) {

    produtoCodigo =
      'hidroxido'

  }


  return `${etaSlug}-${produtoCodigo}`

}


export default CadastroDosadoras