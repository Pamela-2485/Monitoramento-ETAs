import { useNavigate } from 'react-router-dom'

import {
  ClipboardCheck,
  FlaskConical,
  Radio,
  Gauge,
  ChevronRight
} from 'lucide-react'

import './Historico.css'


function Historico() {

  const navigate = useNavigate()

  return (

    <div className="pagina-historico">

      <div className="cabecalho-historico">

        <span>
          REGISTROS
        </span>

        <h1>
          Histórico
        </h1>

        <p>
          Consulte os registros operacionais
          e de monitoramento das ETAs.
        </p>

      </div>


      <div className="grid-historico">


        {/* ANÁLISES */}

        <button
          className="card-historico"
          type="button"
          onClick={() =>
            navigate('/historico/analises')
          }
        >

          <div className="icone-historico">
            <ClipboardCheck size={25} />
          </div>


          <div className="conteudo-card-historico">

            <h2>
              Análises
            </h2>

            <p>
              Consulte as análises realizadas
              nas ETAs e na rede por período.
            </p>

            <span>
              Exportação para Excel
            </span>

          </div>


          <ChevronRight
            className="seta-historico"
            size={20}
          />

        </button>


        {/* SOLUÇÕES */}

        <button
          className="card-historico"
          type="button"
          onClick={() =>
            navigate('/historico/solucoes')
          }
        >

          <div className="icone-historico">
            <FlaskConical size={25} />
          </div>


          <div className="conteudo-card-historico">

            <h2>
              Soluções
            </h2>

            <p>
              Consulte os preparos de soluções
              realizados em cada ETA.
            </p>

            <span>
              Histórico de preparos
            </span>

          </div>


          <ChevronRight
            className="seta-historico"
            size={20}
          />

        </button>


        {/* CALIBRAÇÕES */}

        <button
          className="card-historico"
          type="button"
          onClick={() =>
            navigate('/historico/calibracoes')
          }
        >

          <div className="icone-historico">
            <Gauge size={25} />
          </div>


          <div className="conteudo-card-historico">

            <h2>
              Calibrações
            </h2>

            <p>
              Consulte as calibrações realizadas
              nas dosadoras das ETAs.
            </p>

            <span>
              Regulagem das dosadoras
            </span>

          </div>


          <ChevronRight
            className="seta-historico"
            size={20}
          />

        </button>


        {/* MONITORAMENTO */}

        <button
          className="card-historico"
          type="button"
          onClick={() =>
            navigate('/historico/monitoramento')
          }
        >

          <div className="icone-historico">
            <Radio size={25} />
          </div>


          <div className="conteudo-card-historico">

            <h2>
              Monitoramento
            </h2>

            <p>
              Consulte as leituras de nível
              e volume dos reservatórios.
            </p>

            <span>
              Dados dos ESP32
            </span>

          </div>


          <ChevronRight
            className="seta-historico"
            size={20}
          />

        </button>


      </div>

    </div>

  )

}

export default Historico