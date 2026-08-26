import { useNavigate } from 'react-router-dom'

import {
  Cylinder,
  Droplet
} from 'lucide-react'

import './CardETA.css'


function CardETA({ eta }) {

  const navigate = useNavigate()


  function abrirEta() {

    navigate(
      `/eta/${eta.id}`
    )

  }


  const quantidadeReservatorios =
    eta.produtos?.length || 0


  return (

    <div
      className="card-eta"
      onClick={abrirEta}
    >

      <div className="icone-eta">

        <Cylinder
          size={38}
          strokeWidth={1.8}
        />

        <Droplet
          size={17}
          strokeWidth={2}
          className="icone-gota"
        />

      </div>


      <h2>
        ETA {eta.nome}
      </h2>


      <p>

        {quantidadeReservatorios}

        {' '}

        {quantidadeReservatorios === 1
          ? 'reservatório'
          : 'reservatórios'
        }

      </p>


      <button>
        Acessar
      </button>

    </div>

  )

}


export default CardETA