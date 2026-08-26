import {
  NavLink,
  useNavigate
} from 'react-router-dom'

import { LogOut } from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Sidebar.css'


function Sidebar({
  fecharMenu
}) {

  const navigate = useNavigate()


  function fecharMenuMobile() {

    if (fecharMenu) {
      fecharMenu()
    }

  }


  async function sair() {

    const { error } =
      await supabase.auth.signOut()


    if (error) {

      console.error(
        'Erro ao sair:',
        error
      )

      alert(
        'Não foi possível sair do sistema.'
      )

      return
    }


    fecharMenuMobile()


    navigate(
      '/login',
      {
        replace: true
      }
    )

  }


  return (

    <aside
      className="sidebar"
      translate="no"
    >

      <div className="sidebar-logo-card">

        <img
          src="/imagem/monitoramento-etas.png"
          alt="Litoral Saneamento - Monitoramento ETAs"
          className="sidebar-logo"
        />

      </div>


      <nav className="sidebar-menu">


        <NavLink
          to="/"
          end
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item menu-item-ativo'
              : 'menu-item'
          }
        >

          <span className="menu-icone">
            🏠
          </span>

          <span className="menu-texto">
            Início
          </span>

        </NavLink>


        <NavLink
          to="/solucoes"
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item ativo'
              : 'menu-item'
          }
        >
          🧪 Soluções
        </NavLink>


        <NavLink
          to="/dosagem"
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item ativo'
              : 'menu-item'
          }
        >
          💧 Dosagem
        </NavLink>


        <NavLink
          to="/analises"
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item ativo'
              : 'menu-item'
          }
        >
          📋 Análises
        </NavLink>


        <NavLink
          to="/historico"
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item ativo'
              : 'menu-item'
          }
        >
          🕘 Histórico
        </NavLink>


        <NavLink
          to="/cadastros"
          onClick={fecharMenuMobile}
          className={({ isActive }) =>
            isActive
              ? 'menu-item ativo'
              : 'menu-item'
          }
        >
          ⚙️ Cadastros
        </NavLink>

      </nav>


      {/* SAIR */}

      <button
        type="button"
        className="botao-sair-sidebar"
        onClick={sair}
      >

        <LogOut size={18} />

        <span>
          Sair
        </span>

      </button>

    </aside>

  )

}


export default Sidebar