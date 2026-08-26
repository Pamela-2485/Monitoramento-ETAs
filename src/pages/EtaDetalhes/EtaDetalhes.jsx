import {
  useEffect,
  useState
} from 'react'

import {
  useNavigate,
  useParams
} from 'react-router-dom'

import {
  ArrowLeft,
  Wifi,
  WifiOff,
  BellRing,
  TriangleAlert
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import Reservatorio from '../../components/Reservatorio/Reservatorio'

import './EtaDetalhes.css'


function EtaDetalhes() {

  const { id } = useParams()
  const navigate = useNavigate()


  const [eta, setEta] =
    useState(null)

  const [
    reservatorios,
    setReservatorios
  ] = useState([])

  const [
    carregando,
    setCarregando
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


  // =========================
  // CARREGAR ETA
  // E RESERVATÓRIOS
  // =========================

  useEffect(() => {

    async function carregarDados() {

      setCarregando(true)
      setErroCarregamento('')


      try {

        // =========================
        // LOCALIZA A ETA
        // =========================

        const {
          data: etaBanco,
          error: erroEta
        } =
          await supabase
            .from('etas')
            .select(`
              id,
              nome,
              slug
            `)
            .eq(
              'slug',
              id
            )
            .single()


        if (erroEta) {

          console.error(
            'Erro ao localizar ETA:',
            erroEta
          )

          setErroCarregamento(
            'Não foi possível localizar a ETA.'
          )

          return
        }


        setEta(
          etaBanco
        )


        // =========================
        // BUSCA RESERVATÓRIOS
        // =========================

        const {
          data: reservatoriosBanco,
          error: erroReservatorios
        } =
          await supabase
            .from('reservatorios')
            .select(`
              id,
              nome,
              capacidade_l,
              limite_minimo_percentual,
              ativo,

              produtos (
                id,
                nome,
                slug
              )
            `)
            .eq(
              'eta_id',
              etaBanco.id
            )
            .eq(
              'ativo',
              true
            )
            .order(
              'created_at',
              {
                ascending: true
              }
            )


        if (erroReservatorios) {

          console.error(
            'Erro ao carregar reservatórios:',
            erroReservatorios
          )

          setErroCarregamento(
            'Não foi possível carregar os reservatórios.'
          )

          return
        }


        // =========================
        // BUSCAR ÚLTIMA LEITURA
        // DE CADA RESERVATÓRIO
        // =========================

        const reservatoriosComLeitura =
          await Promise.all(

            (reservatoriosBanco || [])
              .map(
                async (
                  reservatorio
                ) => {

                  const {
                    data: leituras,
                    error: erroLeitura
                  } =
                    await supabase
                      .from(
                        'leituras_reservatorios'
                      )
                      .select(`
                        volume_l,
                        percentual,
                        esp32_status,
                        data_leitura
                      `)
                      .eq(
                        'reservatorio_id',
                        reservatorio.id
                      )
                      .order(
                        'data_leitura',
                        {
                          ascending: false
                        }
                      )
                      .limit(1)


                  if (erroLeitura) {

                    console.error(
                      'Erro ao carregar leitura:',
                      erroLeitura
                    )

                  }


                  const ultimaLeitura =
                    leituras?.[0] || null


                  return {

                    id:
                      reservatorio.id,

                    nome:
                      reservatorio
                        .produtos
                        ?.nome ||
                      reservatorio.nome,

                    produtoSlug:
                      reservatorio
                        .produtos
                        ?.slug ||
                      '',

                    capacidade:
                      Number(
                        reservatorio
                          .capacidade_l
                      ),

                    limiteMinimo:
                      Number(
                        reservatorio
                          .limite_minimo_percentual
                      ),


                    percentual:
                      ultimaLeitura
                        ? Number(
                            ultimaLeitura
                              .percentual
                          )
                        : 0,


                    volume:
                      ultimaLeitura
                        ? Number(
                            ultimaLeitura
                              .volume_l
                          )
                        : 0,


                    esp32:
                      ultimaLeitura
                        ?.esp32_status ||
                      'Sem comunicação',


                    ultimaLeitura:
                      ultimaLeitura
                        ? formatarDataHora(
                            ultimaLeitura
                              .data_leitura
                          )
                        : 'Sem leitura'

                  }

                }
              )

          )


        setReservatorios(
          reservatoriosComLeitura
        )


      } catch (erro) {

        console.error(
          'Erro inesperado:',
          erro
        )

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregando(false)

      }

    }


    carregarDados()

  }, [id])


  // =========================
  // CARREGANDO
  // =========================

  if (carregando) {

    return (

      <div className="pagina-eta">

        <div className="cabecalho-eta">

          <button
            className="botao-voltar"
            onClick={() =>
              navigate('/')
            }
          >

            <ArrowLeft size={20} />

            Voltar

          </button>

        </div>


        <div>
          Carregando reservatórios...
        </div>

      </div>

    )

  }


  // =========================
  // ERRO
  // =========================

  if (erroCarregamento) {

    return (

      <div className="pagina-eta">

        <div className="cabecalho-eta">

          <button
            className="botao-voltar"
            onClick={() =>
              navigate('/')
            }
          >

            <ArrowLeft size={20} />

            Voltar

          </button>

        </div>


        <div>
          {erroCarregamento}
        </div>

      </div>

    )

  }


  // =========================
  // ETA NÃO ENCONTRADA
  // =========================

  if (!eta) {

    return (

      <div>

        <h1>
          ETA não encontrada
        </h1>

      </div>

    )

  }


  return (

    <div className="pagina-eta">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-eta">

        <button
          className="botao-voltar"
          onClick={() =>
            navigate('/')
          }
        >

          <ArrowLeft size={20} />

          Voltar

        </button>


        <div>

          <h1>
            ETA {eta.nome}
          </h1>

          <p>
            Monitoramento dos reservatórios de produtos
          </p>

        </div>

      </div>


      {/* =========================
          RESERVATÓRIOS
      ========================= */}

      <div className="lista-reservatorios">


        {reservatorios.length === 0 && (

          <div>
            Nenhum reservatório cadastrado.
          </div>

        )}


        {reservatorios.map(
          (produto) => {


            const emAlerta =
              produto.percentual <=
              produto.limiteMinimo


            const semComunicacao =
              produto.esp32 !==
              'Online'


            let classificacao =
              'Médio'


            if (
              produto.percentual <= 20
            ) {

              classificacao =
                'Baixo'

            } else if (
              produto.percentual > 70
            ) {

              classificacao =
                'Cheio'

            }


            const volumeAtual =
              Math.round(
                produto.volume
              )


            return (

              <div
                className={
                  emAlerta
                    ? 'bloco-produto bloco-produto-alerta'
                    : 'bloco-produto'
                }
                key={produto.id}
              >


                {/* =========================
                    TÍTULO
                ========================= */}

                <div className="produto-titulo">

                  <h2>
                    {produto.nome}
                  </h2>


                  <div className="avisos-produto">


                    {emAlerta && (

                      <div className="alerta-nivel">

                        <BellRing size={15} />

                        Nível crítico

                      </div>

                    )}


                    {semComunicacao && (

                      <div className="alerta-comunicacao">

                        <TriangleAlert size={14} />

                        Sem comunicação

                      </div>

                    )}


                  </div>

                </div>


                {/* =========================
                    CONTEÚDO
                ========================= */}

                <div className="produto-conteudo">


                  <Reservatorio
                    percentual={
                      produto.percentual
                    }
                  />


                  <div className="card-informacoes">


                    <div className="linha-info">

                      <span>
                        Volume atual
                      </span>

                      <strong>
                        {volumeAtual} L
                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        Capacidade total
                      </span>

                      <strong>
                        {produto.capacidade} L
                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        Nível
                      </span>

                      <strong>
                        {produto.percentual}%
                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        Classificação
                      </span>


                      <strong
                        className={
                          `nivel nivel-${classificacao.toLowerCase()}`
                        }
                      >

                        {classificacao}

                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        Última leitura
                      </span>

                      <strong>
                        {produto.ultimaLeitura}
                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        Limite mínimo
                      </span>

                      <strong>
                        {produto.limiteMinimo}%
                      </strong>

                    </div>


                    <div className="linha-info">

                      <span>
                        ESP32
                      </span>


                      <strong
                        className={
                          produto.esp32 ===
                          'Online'
                            ? 'esp-online'
                            : 'esp-offline'
                        }
                      >


                        {produto.esp32 ===
                          'Online'
                          ? (
                              <Wifi size={14} />
                            )
                          : (
                              <WifiOff size={14} />
                            )
                        }


                        {produto.esp32}

                      </strong>

                    </div>


                  </div>

                </div>

              </div>

            )

          }
        )}

      </div>

    </div>

  )

}


// =========================
// FORMATAR DATA/HORA
// =========================

function formatarDataHora(
  data
) {

  if (!data) {

    return 'Sem leitura'

  }


  const dataHora =
    new Date(data)


  return dataHora.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  )

}


export default EtaDetalhes