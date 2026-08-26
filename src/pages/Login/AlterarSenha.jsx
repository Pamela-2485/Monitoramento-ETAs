import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'

import './RedefinirSenha.css'


function AlterarSenha() {

  const navigate = useNavigate()

  const [senha, setSenha] =
    useState('')

  const [confirmarSenha, setConfirmarSenha] =
    useState('')

  const [carregando, setCarregando] =
    useState(false)


  async function alterarSenha(event) {

    event.preventDefault()


    if (!senha || !confirmarSenha) {

      alert(
        'Informe e confirme a nova senha.'
      )

      return

    }


    if (senha.length < 6) {

      alert(
        'A senha deve possuir pelo menos 6 caracteres.'
      )

      return

    }


    if (senha !== confirmarSenha) {

      alert(
        'As senhas informadas não são iguais.'
      )

      return

    }


    setCarregando(true)


    try {

      const {
        error
      } =
        await supabase.auth
          .updateUser({
            password: senha
          })


      if (error) {

        console.error(
          'Erro ao alterar senha:',
          error
        )

        alert(
          'Não foi possível alterar a senha. Abra novamente o link recebido por e-mail.'
        )

        return

      }


      alert(
        'Senha alterada com sucesso.'
      )


      // Encerra a sessão criada pelo
      // link de recuperação.
      await supabase.auth.signOut()


      navigate(
        '/login',
        {
          replace: true
        }
      )


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
        onSubmit={alterarSenha}
      >


        <div className="imagem-redefinir">

          <img
            src="/imagem/monitoramento-etas.png"
            alt="Monitoramento de ETAs"
          />

        </div>


        <h1>
          Alterar senha
        </h1>


        <p className="texto-redefinir">
          Digite e confirme sua nova senha de acesso.
        </p>


        <div className="campo-redefinir">

          <label>
            Nova senha
          </label>

          <input
            type="password"
            value={senha}
            onChange={(e) =>
              setSenha(
                e.target.value
              )
            }
            placeholder="Digite a nova senha"
            autoComplete="new-password"
          />

        </div>


        <div className="campo-redefinir">

          <label>
            Confirmar nova senha
          </label>

          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) =>
              setConfirmarSenha(
                e.target.value
              )
            }
            placeholder="Digite novamente"
            autoComplete="new-password"
          />

        </div>


        <button
          className="botao-enviar-link"
          type="submit"
          disabled={carregando}
        >

          {carregando
            ? 'Alterando...'
            : 'Alterar senha'
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


export default AlterarSenha