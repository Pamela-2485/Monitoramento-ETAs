import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

import './RedefinirSenha.css'


function RedefinirSenha() {

  const navigate = useNavigate()

  const [email, setEmail] =
    useState('')

  const [carregando, setCarregando] =
    useState(false)


  async function enviarLink(event) {

    event.preventDefault()


    if (!email) {

      alert(
        'Informe o seu e-mail.'
      )

      return

    }


    setCarregando(true)


    try {

      const {
        error
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
             `${window.location.origin}/alterar-senha`
            }
          )


      if (error) {

        console.error(
          'Erro ao enviar redefinição:',
          error
        )

        alert(
          'Não foi possível enviar o link de redefinição.'
        )

        return

      }


      alert(
        'Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.'
      )


      setEmail('')


    } catch (erro) {

      console.error(
        'Erro inesperado:',
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

    <div className="pagina-redefinir">


      <form
        className="card-redefinir"
        onSubmit={enviarLink}
      >


        <div className="imagem-redefinir">

          <img
            src="/imagem/monitoramento-etas.png"
            alt="Monitoramento de ETAs"
          />

        </div>


        <h1>
          Redefinir senha
        </h1>


        <p className="texto-redefinir">
          Informe seu e-mail para receber o link de redefinição de senha.
        </p>


        <div className="campo-redefinir">

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


        <button
          className="botao-enviar-link"
          type="submit"
          disabled={carregando}
        >

          {carregando
            ? 'Enviando...'
            : 'Enviar link'
          }

        </button>


        <button
          className="botao-voltar-login"
          type="button"
          onClick={() =>
            navigate('/login')
          }
        >

          Voltar para o login

        </button>


      </form>

    </div>

  )

}


export default RedefinirSenha