import {
  useEffect,
  useState
} from 'react'

import CardETA from '../../components/CardETA/CardETA'

import { supabase } from '../../lib/supabase'

import './Inicio.css'


function Inicio() {

  const [etas, setEtas] =
    useState([])

  const [
    carregando,
    setCarregando
  ] = useState(true)

  const [
    erroCarregamento,
    setErroCarregamento
  ] = useState('')


  useEffect(() => {

    async function carregarEtas() {

      setCarregando(true)
      setErroCarregamento('')


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
              slug,

              reservatorios (
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
              )
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

          setErroCarregamento(
            'Não foi possível carregar as ETAs.'
          )

          return
        }


        const etasFormatadas =
          (data || []).map(
            (eta) => ({

              id:
                eta.slug,

              nome:
                eta.nome,

              produtos:
                (eta.reservatorios || [])
                  .filter(
                    (reservatorio) =>
                      reservatorio.ativo
                  )
                  .map(
                    (reservatorio) => ({

                      id:
                        reservatorio.id,

                      nome:
                        reservatorio
                          .produtos
                          ?.nome ||
                        reservatorio.nome,

                      capacidade:
                        Number(
                          reservatorio
                            .capacidade_l
                        ),

                      limiteMinimo:
                        Number(
                          reservatorio
                            .limite_minimo_percentual
                        )

                    })
                  )

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

        setErroCarregamento(
          'Não foi possível conectar ao banco de dados.'
        )

      } finally {

        setCarregando(false)

      }

    }


    carregarEtas()

  }, [])


  if (carregando) {

    return (

      <div className="pagina-inicio">

        <h1 className="titulo-inicio">
          Monitoramento de ETAs
        </h1>

        <p className="subtitulo-inicio">
          Carregando ETAs...
        </p>

      </div>

    )

  }


  if (erroCarregamento) {

    return (

      <div className="pagina-inicio">

        <h1 className="titulo-inicio">
          Monitoramento de ETAs
        </h1>

        <p className="subtitulo-inicio">
          {erroCarregamento}
        </p>

      </div>

    )

  }


  return (

    <div className="pagina-inicio">

      <h1 className="titulo-inicio">
        Monitoramento de ETAs
      </h1>

      <p className="subtitulo-inicio">
        Selecione uma ETA para visualizar os reservatórios
      </p>


      <div className="grid-etas">

        {etas.map(
          (eta) => (

            <CardETA
              key={eta.id}
              eta={eta}
            />

          )
        )}

      </div>

    </div>

  )

}


export default Inicio