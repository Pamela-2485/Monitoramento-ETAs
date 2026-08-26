import { useNavigate } from 'react-router-dom'

import {
  FlaskConical,
  Gauge,
  ChevronRight
} from 'lucide-react'

import './Cadastros.css'

function Cadastros() {

  const navigate = useNavigate()

  return (

    <div className="pagina-cadastros">

      <div className="cabecalho-cadastros">

        <span>
          CONFIGURAÇÕES
        </span>

        <h1>
          Cadastros
        </h1>

        <p>
          Gerencie os dados utilizados nos cálculos
          e operações das ETAs.
        </p>

      </div>


      <div className="grid-cadastros">


        {/* PRODUTOS */}

        <button
          className="card-cadastro"
          type="button"
          onClick={() =>
            navigate('/cadastros/produtos')
          }
        >

          <div className="icone-cadastro">

            <FlaskConical size={25} />

          </div>


          <div className="conteudo-card-cadastro">

            <h2>
              Produtos
            </h2>

            <p>
              Concentração, densidade, peso da
              embalagem e demais informações dos
              produtos utilizados nas ETAs.
            </p>

          </div>


          <ChevronRight
            className="seta-cadastro"
            size={20}
          />

        </button>


        {/* DOSADORAS */}

        <button
          className="card-cadastro"
          type="button"
          onClick={() =>
            navigate('/cadastros/dosadoras')
          }
        >

          <div className="icone-cadastro">

            <Gauge size={25} />

          </div>


          <div className="conteudo-card-cadastro">

            <h2>
              Dosadoras
            </h2>

            <p>
              Cadastro técnico das bombas,
              capacidades e pulsações disponíveis.
            </p>

          </div>


          <ChevronRight
            className="seta-cadastro"
            size={20}
          />

        </button>

      </div>

    </div>

  )

}

export default Cadastros