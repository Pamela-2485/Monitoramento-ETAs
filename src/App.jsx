import {
  useEffect,
  useState
} from 'react'

import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import Layout from './components/Layout/Layout'

import EtaDetalhes from './pages/EtaDetalhes/EtaDetalhes'

import Inicio from './pages/Inicio/Inicio'
import Solucoes from './pages/Solucoes/Solucoes'
import Dosagem from './pages/Dosagem/Dosagem'
import Analises from './pages/Analises/Analises'
import Historico from './pages/Historico/Historico'

import CalibracaoDosadora from './pages/Dosagem/CalibracaoDosadora'
import SimulacaoDosagem from './pages/Dosagem/SimulacaoDosagem'

import Cadastros from './pages/cadastros/Cadastros'
import CadastroProdutos from './pages/cadastros/CadastroProdutos'
import CadastroDosadoras from './pages/cadastros/CadastroDosadoras'

import HistoricoAnalises from './pages/Historico/HistoricoAnalises'
import HistoricoSolucoes from './pages/Historico/HistoricoSolucoes'
import HistoricoMonitoramento from './pages/Historico/HistoricoMonitoramento'
import HistoricoCalibracoes from './pages/Historico/HistoricoCalibracoes'

import Login from './pages/Login/Login'
import RedefinirSenha from './pages/Login/RedefinirSenha'
import AlterarSenha from './pages/Login/AlterarSenha'

import { supabase } from './lib/supabase'


function App() {

  const [
    sessao,
    setSessao
  ] = useState(null)

  const [
    carregandoSessao,
    setCarregandoSessao
  ] = useState(true)


  // =========================
  // VERIFICAR SESSÃO
  // =========================

  useEffect(() => {

    async function verificarSessao() {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession()


      if (error) {

        console.error(
          'Erro ao verificar sessão:',
          error
        )

      }


      setSessao(
        data?.session || null
      )

      setCarregandoSessao(false)

    }


    verificarSessao()


    const {
      data: listener
    } =
      supabase.auth
        .onAuthStateChange(
          (
            evento,
            novaSessao
          ) => {

            setSessao(
              novaSessao
            )

            setCarregandoSessao(false)

          }
        )


    return () => {

      listener
        .subscription
        .unsubscribe()

    }

  }, [])


  // =========================
  // CARREGANDO SESSÃO
  // =========================

  if (carregandoSessao) {

    return (

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >

        Carregando sistema...

      </div>

    )

  }


  return (

    <Routes>


      {/* =========================
          ROTAS PÚBLICAS
      ========================= */}

      <Route
        path="/login"
        element={
          sessao
            ? <Navigate
                to="/"
                replace
              />
            : <Login />
        }
      />


      <Route
        path="/redefinir-senha"
        element={
          <RedefinirSenha />
        }
      />

      <Route
  path="/alterar-senha"
  element={<AlterarSenha />}
/>


      {/* =========================
          ROTAS PROTEGIDAS
      ========================= */}

      <Route
        element={
          sessao
            ? <Layout />
            : <Navigate
                to="/login"
                replace
              />
        }
      >


        <Route
          path="/"
          element={<Inicio />}
        />


        <Route
          path="/eta/:id"
          element={<EtaDetalhes />}
        />


        <Route
          path="/solucoes"
          element={<Solucoes />}
        />


        <Route
          path="/dosagem"
          element={<Dosagem />}
        />


        <Route
          path="/dosagem/calibracao/:id"
          element={<CalibracaoDosadora />}
        />


        <Route
          path="/dosagem/simulacao/:id"
          element={<SimulacaoDosagem />}
        />


        <Route
          path="/analises"
          element={<Analises />}
        />


        <Route
          path="/historico"
          element={<Historico />}
        />


        <Route
          path="/historico/analises"
          element={<HistoricoAnalises />}
        />


        <Route
          path="/historico/solucoes"
          element={<HistoricoSolucoes />}
        />


        <Route
          path="/historico/monitoramento"
          element={<HistoricoMonitoramento />}
        />


        <Route
          path="/historico/calibracoes"
          element={<HistoricoCalibracoes />}
        />


        <Route
          path="/cadastros"
          element={<Cadastros />}
        />


        <Route
          path="/cadastros/produtos"
          element={<CadastroProdutos />}
        />


        <Route
          path="/cadastros/dosadoras"
          element={<CadastroDosadoras />}
        />


      </Route>


      {/* =========================
          ROTA DESCONHECIDA
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              sessao
                ? '/'
                : '/login'
            }
            replace
          />
        }
      />


    </Routes>

  )

}


export default App