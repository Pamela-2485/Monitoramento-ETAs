import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from '../Sidebar/Sidebar'

import './Layout.css'


function Layout() {

  const [
    menuAberto,
    setMenuAberto
  ] = useState(false)


  function alternarMenu() {

    setMenuAberto(
      (aberto) => !aberto
    )

  }


  function fecharMenu() {

    setMenuAberto(false)

  }


  return (

    <div className="layout">


      {/* BOTÃO MOBILE */}

      <button
        className="botao-menu-mobile"
        type="button"
        onClick={alternarMenu}
        aria-label="Abrir menu"
      >

        ⋮

      </button>


      {/* FUNDO ESCURO MOBILE */}

      {menuAberto && (

        <button
          className="fundo-menu-mobile"
          type="button"
          onClick={fecharMenu}
          aria-label="Fechar menu"
        />

      )}


      {/* SIDEBAR */}

      <div
        className={
          menuAberto
            ? 'sidebar-mobile-aberta'
            : 'sidebar-mobile-fechada'
        }
      >

        <Sidebar
          fecharMenu={fecharMenu}
        />

      </div>


      {/* CONTEÚDO */}

      <main className="conteudo-principal">

        <Outlet />

      </main>


    </div>

  )

}


export default Layout