import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

import './Login.css'


function Login() {

  const navigate = useNavigate()

  const [email, setEmail] =
    useState('')

  const [senha, setSenha] =
    useState('')

  const [carregando, setCarregando] =
    useState(false)


  async function entrar(event) {

    event.preventDefault()


    if (!email || !senha) {

      alert(
        'Informe o e-mail e a senha.'
      )

      return

    }


    setCarregando(true)


    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              email.trim(),

            password:
              senha

          })


      if (error) {

        console.error(
          'Erro no login:',
          error
        )


        alert(
          'E-mail ou senha inválidos.'
        )

        return

      }


      if (!data.session) {

        alert(
          'Não foi possível iniciar a sessão.'
        )

        return

      }


      navigate('/')


    } catch (erro) {

      console.error(
        'Erro inesperado no login:',
        erro
      )


      alert(
        'Não foi possível conectar ao sistema.'
      )

    } finally {

      setCarregando(false)

    }

  }


  return (

    <div className="pagina-login">


      <form
        className="card-login"
        onSubmit={entrar}
      >


        <div className="imagem-login">

          <img
            src="/imagem/monitoramento-etas.png"
            alt="Monitoramento de ETAs"
          />

        </div>


        <h1>
          Monitoramento de ETAs
        </h1>


        <p className="subtitulo-login">
          Acesso ao sistema
        </p>


        <div className="campo-login">

          <label>
            E-mail
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Digite seu e-mail"
            autoComplete="email"
          />

        </div>


        <div className="campo-login">

          <label>
            Senha
          </label>

          <input
            type="password"
            value={senha}
            onChange={(e) =>
              setSenha(
                e.target.value
              )
            }
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />

        </div>


        <div className="area-redefinir-senha">

          <button
            type="button"
            className="botao-redefinir-senha"
            onClick={() =>
              navigate(
                '/redefinir-senha'
              )
            }
          >

            Esqueceu a senha?

          </button>

        </div>


        <button
          className="botao-entrar"
          type="submit"
          disabled={carregando}
        >

          {carregando
            ? 'Entrando...'
            : 'Entrar'
          }

        </button>


      </form>

    </div>

  )

}


export default Login