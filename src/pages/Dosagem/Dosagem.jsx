import {
  useEffect,
  useState
} from 'react'

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import {
  Gauge,
  Beaker,
  Calculator,
  ChevronRight
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Dosagem.css'


function Dosagem() {

  const navigate = useNavigate()

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams()


  const [
    dosadoras,
    setDosadoras
  ] = useState([])

  const [
    carregando,
    setCarregando
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


  const dosadoraSelecionada =
    searchParams.get('dosadora') || ''


  // =========================
  // CARREGAR DOSADORAS
  // =========================

  useEffect(() => {

    async function carregarDosadoras() {

      setCarregando(true)
      setErroCarregamento('')


      try {

        const {
          data,
          error
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


        if (error) {

          console.error(
            'Erro ao carregar dosadoras:',
            error
          )

          setErroCarregamento(
            'Não foi possível carregar as dosadoras.'
          )

          return

        }


        const dosadorasFormatadas =
          (data || []).map(
            (dosadora) => ({

              id:
                dosadora.codigo,

              bancoId:
                dosadora.id,

              nome:
                dosadora.nome,

              etaId:
                dosadora.etas?.slug || '',

              etaNome:
                dosadora.etas?.nome || '-',

              produtoId:
                converterProdutoSlugParaLocal(
                  dosadora.produtos?.slug
                ),

              produtoNome:
                dosadora.produtos?.nome || '-',

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
                  : []

            })
          )


        setDosadoras(
          dosadorasFormatadas
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar dosadoras:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregando(false)

      }

    }


    carregarDosadoras()

  }, [])


  // =========================
  // DOSADORA SELECIONADA
  // =========================

  const dosadoraAtual =
    dosadoras.find(
      (item) =>
        item.id ===
        dosadoraSelecionada
    )


  function alterarDosadora(
    event
  ) {

    const valor =
      event.target.value


    if (valor) {

      setSearchParams({
        dosadora: valor
      })

    } else {

      setSearchParams({})

    }

  }


  // =========================
  // CARREGANDO
  // =========================

  if (carregando) {

    return (

      <div className="pagina-dosagem">

        <div className="cabecalho-dosagem">

          <div className="icone-dosagem">

            <Gauge size={28} />

          </div>


          <div>

            <h1>
              Dosagem
            </h1>

            <p>
              Carregando dosadoras...
            </p>

          </div>

        </div>

      </div>

    )

  }


  // =========================
  // ERRO
  // =========================

  if (erroCarregamento) {

    return (

      <div className="pagina-dosagem">

        <div className="cabecalho-dosagem">

          <div className="icone-dosagem">

            <Gauge size={28} />

          </div>


          <div>

            <h1>
              Dosagem
            </h1>

            <p>
              {erroCarregamento}
            </p>

          </div>

        </div>

      </div>

    )

  }


  return (

    <div className="pagina-dosagem">


      {/* CABEÇALHO */}

      <div className="cabecalho-dosagem">

        <div className="icone-dosagem">

          <Gauge size={28} />

        </div>


        <div>

          <h1>
            Dosagem
          </h1>

          <p>
            Calibração e simulação das dosadoras das ETAs
          </p>

        </div>

      </div>


      {/* SELEÇÃO DA DOSADORA */}

      <div className="card-selecao-dosadora">

        <div className="campo-dosagem">

          <label>
            Dosadora
          </label>


          <select
            value={dosadoraSelecionada}
            onChange={alterarDosadora}
          >

            <option value="">
              Selecione uma dosadora
            </option>


            {dosadoras.map(
              (dosadora) => (

                <option
                  key={dosadora.id}
                  value={dosadora.id}
                >

                  {dosadora.nome}

                </option>

              )
            )}

          </select>

        </div>

      </div>


      {/* DOSADORA SELECIONADA */}

      {dosadoraAtual && (

        <>


          {/* RESUMO */}

          <div className="resumo-dosadora-selecionada">


            <div>

              <span>
                ETA
              </span>

              <strong>
                {dosadoraAtual.etaNome}
              </strong>

            </div>


            <div>

              <span>
                Produto
              </span>

              <strong>
                {dosadoraAtual.produtoNome}
              </strong>

            </div>


          </div>


          {/* OPÇÕES */}

          <div className="opcoes-dosagem">


            {/* CALIBRAÇÃO */}

            <button
              className="card-opcao-dosagem"
              type="button"
              onClick={() =>
                navigate(
                  `/dosagem/calibracao/${dosadoraAtual.id}`
                )
              }
            >

              <div className="icone-opcao-dosagem">

                <Beaker size={27} />

              </div>


              <div className="texto-opcao-dosagem">

                <h2>
                  Calibração
                </h2>

                <p>
                  Informações da dosadora, pulsação,
                  cursor e medição da vazão real.
                </p>

              </div>


              <ChevronRight
                className="seta-opcao"
                size={22}
              />

            </button>


            {/* SIMULAÇÃO */}

            <button
              className="card-opcao-dosagem"
              type="button"
              onClick={() =>
                navigate(
                  `/dosagem/simulacao/${dosadoraAtual.id}`
                )
              }
            >

              <div className="icone-opcao-dosagem">

                <Calculator size={27} />

              </div>


              <div className="texto-opcao-dosagem">

                <h2>
                  Simulação
                </h2>

                <p>
                  Simule a dosagem desejada,
                  aplicação da solução e autonomia.
                </p>

              </div>


              <ChevronRight
                className="seta-opcao"
                size={22}
              />

            </button>


          </div>

        </>

      )}

    </div>

  )

}


// =========================
// SLUG DO BANCO → ID LOCAL
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


export default Dosagem