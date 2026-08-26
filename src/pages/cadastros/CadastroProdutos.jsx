import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  X,
  Save
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './CadastroProdutos.css'


function CadastroProdutos() {

  const navigate = useNavigate()


  // =========================
  // PRODUTOS
  // =========================

  const [produtos, setProdutos] =
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

  const [concentracao, setConcentracao] =
    useState('')

  const [densidade, setDensidade] =
    useState('')

  const [pesoGalao, setPesoGalao] =
    useState('')

  const [estadoFisico, setEstadoFisico] =
    useState('Líquido')

  const [salvando, setSalvando] =
    useState(false)


  // =========================
  // CARREGAR PRODUTOS
  // =========================

  useEffect(() => {

    carregarProdutos()

  }, [])


  async function carregarProdutos() {

    setCarregando(true)


    try {

      const {
        data,
        error
      } =
        await supabase
          .from('produtos')
          .select(`
            id,
            nome,
            slug,
            concentracao,
            densidade,
            peso_galao,
            estado_fisico,
            unidade_concentracao
          `)
          .order(
            'nome',
            {
              ascending: true
            }
          )


      if (error) {

        console.error(
          'Erro ao carregar produtos:',
          error
        )

        alert(
          'Não foi possível carregar os produtos.'
        )

        return
      }


      const produtosFormatados =
        (data || []).map(
          (produto) => ({

            id:
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


      setProdutos(
        produtosFormatados
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
  // LIMPAR FORMULÁRIO
  // =========================

  function limparFormulario() {

    setNome('')
    setConcentracao('')
    setDensidade('')
    setPesoGalao('')
    setEstadoFisico('Líquido')

    setEditandoId(null)

  }


  // =========================
  // NOVO PRODUTO
  // =========================

  function abrirNovoProduto() {

    limparFormulario()

    setFormAberto(true)

  }


  // =========================
  // EDITAR PRODUTO
  // =========================

  function editarProduto(produto) {

    setEditandoId(
      produto.id
    )

    setNome(
      produto.nome || ''
    )

    setConcentracao(
      produto.concentracao ?? ''
    )

    setDensidade(
      produto.densidade ?? ''
    )

    setPesoGalao(
      produto.pesoGalao ?? ''
    )

    setEstadoFisico(
      produto.estadoFisico ||
      'Líquido'
    )

    setFormAberto(true)

  }


  // =========================
  // FECHAR FORMULÁRIO
  // =========================

  function fecharFormulario() {

    setFormAberto(false)

    limparFormulario()

  }


  // =========================
  // SALVAR PRODUTO
  // =========================

  async function salvarProduto() {

    if (!nome.trim()) {

      alert(
        'Informe o nome do produto.'
      )

      return
    }


    if (
      Number(concentracao) <= 0
    ) {

      alert(
        'Informe uma concentração válida.'
      )

      return
    }


    if (
      Number(densidade) <= 0
    ) {

      alert(
        'Informe uma densidade válida.'
      )

      return
    }


    if (
      Number(pesoGalao) <= 0
    ) {

      alert(
        'Informe o peso da embalagem.'
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
            .from('produtos')
            .update({

              nome:
                nome.trim(),

              concentracao:
                Number(concentracao),

              densidade:
                Number(densidade),

              peso_galao:
                Number(pesoGalao),

              estado_fisico:
                estadoFisico

            })
            .eq(
              'id',
              editandoId
            )


        if (error) {

          console.error(
            'Erro ao editar produto:',
            error
          )

          alert(
            'Não foi possível editar o produto.'
          )

          return
        }


        alert(
          'Produto atualizado com sucesso.'
        )

      }

      // =========================
      // NOVO
      // =========================

      else {

        const slug =
          criarSlug(
            nome
          )


        const {
          error
        } =
          await supabase
            .from('produtos')
            .insert({

              nome:
                nome.trim(),

              slug,

              concentracao:
                Number(concentracao),

              densidade:
                Number(densidade),

              peso_galao:
                Number(pesoGalao),

              estado_fisico:
                estadoFisico,

              unidade_concentracao:
                '%'

            })


        if (error) {

          console.error(
            'Erro ao cadastrar produto:',
            error
          )


          if (
            error.code === '23505'
          ) {

            alert(
              'Já existe um produto com esse nome ou identificador.'
            )

          } else {

            alert(
              'Não foi possível cadastrar o produto.'
            )

          }

          return
        }


        alert(
          'Produto cadastrado com sucesso.'
        )

      }


      fecharFormulario()

      await carregarProdutos()


    } catch (erro) {

      console.error(
        'Erro inesperado ao salvar produto:',
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
  // EXCLUIR PRODUTO
  // =========================

  async function excluirProduto(produto) {

    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${produto.nome}"?`
      )


    if (!confirmar) {
      return
    }


    try {

      const {
        error
      } =
        await supabase
          .from('produtos')
          .delete()
          .eq(
            'id',
            produto.id
          )


      if (error) {

        console.error(
          'Erro ao excluir produto:',
          error
        )


        if (
          error.code === '23503'
        ) {

          alert(
            'Este produto não pode ser excluído porque já está sendo utilizado no sistema.'
          )

        } else {

          alert(
            'Não foi possível excluir o produto.'
          )

        }

        return
      }


      setProdutos(
        (produtosAtuais) =>
          produtosAtuais.filter(
            (item) =>
              item.id !== produto.id
          )
      )


      alert(
        'Produto excluído com sucesso.'
      )


    } catch (erro) {

      console.error(
        'Erro inesperado ao excluir produto:',
        erro
      )

      alert(
        'Não foi possível conectar ao banco de dados.'
      )

    }

  }


  return (

    <div className="pagina-produtos">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-produtos">

        <div className="titulo-produtos">

          <button
            className="botao-voltar-produtos"
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
              Produtos
            </h1>

            <p>
              Produtos utilizados no preparo
              das soluções das ETAs.
            </p>

          </div>

        </div>


        <button
          className="botao-novo-produto"
          type="button"
          onClick={abrirNovoProduto}
        >

          <Plus size={17} />

          Novo produto

        </button>

      </div>


      {/* =========================
          FORMULÁRIO
      ========================= */}

      {formAberto && (

        <div className="formulario-produto">

          <div className="topo-formulario-produto">

            <h2>

              {editandoId
                ? 'Editar produto'
                : 'Novo produto'
              }

            </h2>


            <button
              type="button"
              onClick={fecharFormulario}
            >

              <X size={18} />

            </button>

          </div>


          <div className="grid-formulario-produto">


            <div className="campo-formulario-produto">

              <label>
                Nome do produto
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                placeholder="Ex.: Hipoclorito de Sódio"
              />

            </div>


            <div className="campo-formulario-produto">

              <label>
                Concentração
              </label>

              <div className="input-unidade-produto">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={concentracao}
                  onChange={(e) =>
                    setConcentracao(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 12"
                />

                <span>
                  %
                </span>

              </div>

            </div>


            <div className="campo-formulario-produto">

              <label>
                Densidade
              </label>

              <div className="input-unidade-produto">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={densidade}
                  onChange={(e) =>
                    setDensidade(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 1.10"
                />

                <span>
                  kg/L
                </span>

              </div>

            </div>


            <div className="campo-formulario-produto">

              <label>
                Peso da embalagem
              </label>

              <div className="input-unidade-produto">

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={pesoGalao}
                  onChange={(e) =>
                    setPesoGalao(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: 25"
                />

                <span>
                  kg
                </span>

              </div>

            </div>


            <div className="campo-formulario-produto">

              <label>
                Estado físico
              </label>

              <select
                value={estadoFisico}
                onChange={(e) =>
                  setEstadoFisico(
                    e.target.value
                  )
                }
              >

                <option value="Líquido">
                  Líquido
                </option>

                <option value="Sólido">
                  Sólido
                </option>

              </select>

            </div>

          </div>


          <button
            className="botao-salvar-produto"
            type="button"
            onClick={salvarProduto}
            disabled={salvando}
          >

            <Save size={16} />

            {salvando
              ? 'Salvando...'
              : 'Salvar produto'
            }

          </button>

        </div>

      )}


      {/* =========================
          LISTA
      ========================= */}

      <div className="grid-produtos">


        {carregando ? (

          <p>
            Carregando produtos...
          </p>

        ) : produtos.length === 0 ? (

          <p>
            Nenhum produto cadastrado.
          </p>

        ) : (

          produtos.map(
            (produto) => (

              <div
                className="card-produto"
                key={produto.id}
              >


                <div className="topo-card-produto">

                  <div className="icone-produto">

                    <FlaskConical size={22} />

                  </div>


                  <div className="acoes-produto">


                    <button
                      className="botao-editar-produto"
                      type="button"
                      title="Editar produto"
                      onClick={() =>
                        editarProduto(
                          produto
                        )
                      }
                    >

                      <Pencil size={16} />

                    </button>


                    <button
                      className="botao-excluir-produto"
                      type="button"
                      title="Excluir produto"
                      onClick={() =>
                        excluirProduto(
                          produto
                        )
                      }
                    >

                      <Trash2 size={16} />

                    </button>


                  </div>

                </div>


                <h2>
                  {produto.nome}
                </h2>


                <div className="dados-produto">


                  <div>

                    <span>
                      Concentração
                    </span>

                    <strong>
                      {produto.concentracao}%
                    </strong>

                  </div>


                  <div>

                    <span>
                      Densidade
                    </span>

                    <strong>

                      {Number(
                        produto.densidade
                      ).toFixed(2)}

                      {' '}kg/L

                    </strong>

                  </div>


                  <div>

                    <span>
                      Galão
                    </span>

                    <strong>

                      {produto.pesoGalao
                        ? `${produto.pesoGalao} kg`
                        : '--'
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Estado
                    </span>

                    <strong>
                      {produto.estadoFisico}
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
// CRIAR SLUG
// =========================

function criarSlug(
  texto
) {

  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-|$/g,
      ''
    )

}


export default CadastroProdutos