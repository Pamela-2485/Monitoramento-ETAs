import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ArrowLeft,
  Settings,
  Beaker,
  Calculator,
  Save,
  History,
  Plus,
  Trash2
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './CalibracaoDosadora.css'

function CalibracaoDosadora() {

  const { id } = useParams()
  const navigate = useNavigate()

  // =========================
  // DOSADORA / ETA / PRODUTO
  // DIRETAMENTE DO SUPABASE
  // =========================

  const [dosadoraAtual, setDosadoraAtual] =
    useState(null)

  const [etaAtual, setEtaAtual] =
    useState(null)

  const [produtoAtual, setProdutoAtual] =
    useState(null)

  const [carregandoDosadora, setCarregandoDosadora] =
    useState(true)


  /* =========================
     DADOS DA DOSADORA
     SOMENTE LEITURA
  ========================= */

  const [marca, setMarca] =
    useState('')

  const [pressao, setPressao] =
    useState('')

  const [capacidadeNominal, setCapacidadeNominal] =
    useState('')

  const [pulsacoesDisponiveis, setPulsacoesDisponiveis] =
    useState([])


  useEffect(() => {

    async function carregarDosadora() {

      setCarregandoDosadora(true)


      try {

        const {
          data,
          error
        } =
          await supabase
            .from('dosadoras')
            .select(`
              id,
              codigo,
              nome,
              marca,
              pressao,
              capacidade_nominal,
              pulsacoes_disponiveis,

              etas (
                id,
                nome,
                slug
              ),

              produtos (
                id,
                nome,
                slug
              )
            `)
            .eq(
              'codigo',
              id
            )
            .maybeSingle()


        if (error) {

          console.error(
            'Erro ao carregar dosadora:',
            error
          )

          setDosadoraAtual(null)
          setEtaAtual(null)
          setProdutoAtual(null)

          return

        }


        if (!data) {

          setDosadoraAtual(null)
          setEtaAtual(null)
          setProdutoAtual(null)

          return

        }


        const dosadoraFormatada = {

          id:
            data.codigo,

          bancoId:
            data.id,

          nome:
            data.nome,

          marca:
            data.marca || '',

          pressao:
            data.pressao !== null
              ? Number(data.pressao)
              : '',

          capacidadeNominal:
            data.capacidade_nominal !== null
              ? Number(
                  data.capacidade_nominal
                )
              : '',

          pulsacoesDisponiveis:
            Array.isArray(
              data.pulsacoes_disponiveis
            )
              ? data
                  .pulsacoes_disponiveis
                  .map(Number)
              : []

        }


        setDosadoraAtual(
          dosadoraFormatada
        )

        setEtaAtual(
          data.etas || null
        )

        setProdutoAtual(
          data.produtos || null
        )

        setMarca(
          dosadoraFormatada.marca
        )

        setPressao(
          dosadoraFormatada.pressao
        )

        setCapacidadeNominal(
          dosadoraFormatada
            .capacidadeNominal
        )

        setPulsacoesDisponiveis(
          dosadoraFormatada
            .pulsacoesDisponiveis
        )


      } catch (erro) {

        console.error(
          'Erro inesperado ao carregar dosadora:',
          erro
        )

        setDosadoraAtual(null)
        setEtaAtual(null)
        setProdutoAtual(null)

      } finally {

        setCarregandoDosadora(false)

      }

    }


    carregarDosadora()

  }, [id])


  /* =========================
     CALIBRAÇÃO
  ========================= */

  const [pulsacao, setPulsacao] =
    useState('')

  const [cursor, setCursor] =
    useState('')

  const [tempoColeta, setTempoColeta] =
    useState('1')

  const [volumeColetado, setVolumeColetado] =
    useState('')


  /* =========================
     HISTÓRICO LOCAL
  ========================= */

  const [historico, setHistorico] =
    useState([])

  const [carregandoHistorico, setCarregandoHistorico] =
  useState(true)  

    useEffect(() => {

  async function carregarHistorico() {

    setCarregandoHistorico(true)

    if (!dosadoraAtual?.bancoId) {

      setCarregandoHistorico(false)

      return

    }


    const {
      data,
      error
    } =
      await supabase
        .from('calibracoes')
        .select('*')
        .eq('dosadora_id', dosadoraAtual.bancoId)
        .order(
          'data_calibracao',
          { ascending: false }
        )


    if (error) {

      console.error(
        'Erro ao carregar calibrações:',
        error
      )

      setCarregandoHistorico(false)

      return
    }


    const historicoFormatado =
      data.map(
        (item) => ({

          id: item.id,

          pulsacao:
            Number(item.pulsacao),

          cursor:
            Number(item.cursor),

          tempoColeta:
            Number(
              item.tempo_coleta_segundos
            ) / 60,

          volumeColetado:
            Number(
              item.volume_coletado_ml
            ),

          vazaoReal:
            Number(
              item.vazao_real_l_h
            ),

          data:
            new Date(
              item.data_calibracao
            ).toLocaleString(
              'pt-BR'
            )

        })
      )


    setHistorico(
      historicoFormatado
    )

    setCarregandoHistorico(false)

  }


  carregarHistorico()

}, [dosadoraAtual])

  /* =========================
     CÁLCULO DA VAZÃO REAL
  ========================= */

  const vazaoReal = useMemo(() => {

    const tempo = Number(tempoColeta)
    const volume = Number(volumeColetado)

    if (
      tempo <= 0 ||
      volume <= 0
    ) {
      return null
    }

    const mlPorMinuto =
      volume / tempo

    return (
      mlPorMinuto * 60
    ) / 1000

  }, [
    tempoColeta,
    volumeColetado
  ])


  /* =========================
     SALVAR CALIBRAÇÃO
  ========================= */
  
  async function salvarCalibracao() {

  if (!pulsacao) {

    alert(
      'Selecione a pulsação utilizada.'
    )

    return
  }


  if (
    Number(cursor) <= 0 ||
    Number(cursor) > 100
  ) {

    alert(
      'Informe um cursor entre 1% e 100%.'
    )

    return
  }


  if (vazaoReal === null) {

    alert(
      'Informe o tempo de coleta e o volume coletado.'
    )

    return
  }


  try {

    if (!dosadoraAtual?.bancoId) {

      alert(
        'Não foi possível localizar a dosadora no banco de dados.'
      )

      return

    }


    // =========================
    // REGISTRA CALIBRAÇÃO
    // =========================

    const tempoSegundos =
      Number(tempoColeta) * 60


    const {
      data: calibracaoSalva,
      error: erroCalibracao
    } =
      await supabase
        .from('calibracoes')
        .insert({

          dosadora_id:
            dosadoraAtual.bancoId,

          pulsacao:
            Number(pulsacao),

          cursor:
            Number(cursor),

          tempo_coleta_segundos:
            tempoSegundos,

          volume_coletado_ml:
            Number(volumeColetado),

          vazao_real_l_h:
            vazaoReal

        })
        .select()
        .single()


    if (erroCalibracao) {

      console.error(
        'Erro ao registrar calibração:',
        erroCalibracao
      )

      alert(
        'Não foi possível registrar a calibração. O dado não foi salvo.'
      )

      return
    }


    // =========================
    // ATUALIZA HISTÓRICO
    // NA TELA
    // =========================

    const novaCalibracao = {

      id:
        calibracaoSalva.id,

      pulsacao:
        Number(
          calibracaoSalva.pulsacao
        ),

      cursor:
        Number(
          calibracaoSalva.cursor
        ),

      tempoColeta:
        Number(tempoColeta),

      volumeColetado:
        Number(
          calibracaoSalva
            .volume_coletado_ml
        ),

      vazaoReal:
        Number(
          calibracaoSalva
            .vazao_real_l_h
        ),

      data:
        new Date(
          calibracaoSalva.data_calibracao
        ).toLocaleString(
          'pt-BR'
        )

    }


    setHistorico(
      (historicoAtual) => [

        novaCalibracao,

        ...historicoAtual

      ]
    )


    setCursor('')
    setVolumeColetado('')


    alert(
      'Calibração registrada com sucesso.'
    )

  } catch (erro) {

    console.error(
      'Erro inesperado:',
      erro
    )

    alert(
      'Não foi possível conectar ao banco de dados. A calibração não foi salva.'
    )

  }

}
  
  /* =========================
     REMOVER CALIBRAÇÃO
  ========================= */

  async function removerCalibracao(idCalibracao) {

  const confirmar =
    window.confirm(
      'Deseja realmente excluir esta calibração?'
    )

  if (!confirmar) {
    return
  }


  try {

    const { error } =
      await supabase
        .from('calibracoes')
        .delete()
        .eq('id', idCalibracao)


    if (error) {

      console.error(
        'Erro ao excluir calibração:',
        error
      )

      alert(
        'Não foi possível excluir a calibração.'
      )

      return
    }


    setHistorico(
      (historicoAtual) =>
        historicoAtual.filter(
          (item) =>
            item.id !== idCalibracao
        )
    )


    alert(
      'Calibração excluída com sucesso.'
    )

  } catch (erro) {

    console.error(
      'Erro inesperado ao excluir:',
      erro
    )

    alert(
      'Não foi possível conectar ao banco de dados.'
    )

  }

}


  if (carregandoDosadora) {

    return (

      <div className="pagina-calibracao">

        <div className="cabecalho-calibracao">

          <div>

            <h1>
              Calibração da Dosadora
            </h1>

            <p>
              Carregando dados da dosadora...
            </p>

          </div>

        </div>

      </div>

    )

  }


  if (!dosadoraAtual) {

    return (

      <div>

        <h1>
          Dosadora não encontrada
        </h1>

      </div>

    )
  }


  return (

    <div className="pagina-calibracao">


      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="cabecalho-calibracao">

        <button
          className="botao-voltar-calibracao"
          onClick={() =>
            navigate(
              `/dosagem?dosadora=${id}`
            )
          }
        >

          <ArrowLeft size={18} />

          Voltar

        </button>


        <div>

          <h1>
            Calibração da Dosadora
          </h1>

          <p>
            ETA {etaAtual?.nome}
            {' • '}
            {produtoAtual?.nome}
          </p>

        </div>

      </div>


      {/* =========================
          GRID PRINCIPAL
      ========================= */}

      <div className="grid-calibracao">


        {/* =========================
            DADOS DA DOSADORA
        ========================= */}

        <div className="card-calibracao">

          <div className="titulo-calibracao">

            <Settings size={18} />

            <h2>
              Dados da Dosadora
            </h2>

          </div>


          <div className="campo-calibracao">

            <label>
              Marca
            </label>

            <input
              type="text"
              value={marca}
              readOnly
              placeholder="Não informado"
            />

          </div>


          <div className="campo-calibracao">

            <label>
              Pressão
            </label>

            <div className="input-unidade-calibracao">

              <input
                type="number"
                value={pressao}
                readOnly
                placeholder="0"
              />

              <span>
                bar
              </span>

            </div>

          </div>


          <div className="campo-calibracao">

            <label>
              Capacidade nominal
            </label>

            <div className="input-unidade-calibracao">

              <input
                type="number"
                value={capacidadeNominal}
                readOnly
                placeholder="0"
              />

              <span>
                L/h
              </span>

            </div>

          </div>


          {/* PULSAÇÕES */}

          <div className="campo-calibracao">

            <label>
              Pulsações disponíveis
            </label>


            <div className="lista-pulsacoes">

              {pulsacoesDisponiveis.length === 0 && (

                <span className="nenhuma-pulsacao">

                  Nenhuma pulsação cadastrada

                </span>

              )}


              {pulsacoesDisponiveis.map(
                (valor) => (

                  <div
                    className="tag-pulsacao"
                    key={valor}
                  >

                    <span>
                      {valor}%
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* =========================
            NOVA CALIBRAÇÃO
        ========================= */}

        <div className="card-calibracao">

          <div className="titulo-calibracao">

            <Beaker size={18} />

            <h2>
              Nova Calibração
            </h2>

          </div>


          <div className="campo-calibracao">

            <label>
              Pulsação utilizada
            </label>

            <select
              value={pulsacao}
              onChange={(e) =>
                setPulsacao(
                  e.target.value
                )
              }
            >

              <option value="">
                Selecione
              </option>


              {pulsacoesDisponiveis.map(
                (valor) => (

                  <option
                    key={valor}
                    value={valor}
                  >

                    {valor}%

                  </option>

                )
              )}

            </select>

          </div>


          <div className="campo-calibracao">

            <label>
              Cursor
            </label>

            <div className="input-unidade-calibracao">

              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={cursor}
                onChange={(e) =>
                  setCursor(
                    e.target.value
                  )
                }
                placeholder="Ex.: 60"
              />

              <span>
                %
              </span>

            </div>

          </div>


          <div className="campo-calibracao">

            <label>
              Tempo de coleta
            </label>

            <div className="input-unidade-calibracao">

              <input
                type="number"
                min="0.1"
                step="0.1"
                value={tempoColeta}
                onChange={(e) =>
                  setTempoColeta(
                    e.target.value
                  )
                }
              />

              <span>
                min
              </span>

            </div>

          </div>


          <div className="campo-calibracao">

            <label>
              Volume coletado
            </label>

            <div className="input-unidade-calibracao">

              <input
                type="number"
                min="0"
                step="0.1"
                value={volumeColetado}
                onChange={(e) =>
                  setVolumeColetado(
                    e.target.value
                  )
                }
                placeholder="0"
              />

              <span>
                mL
              </span>

            </div>

          </div>


          {/* RESULTADO */}

          <div className="resultado-vazao">

            <span>
              Vazão real medida
            </span>

            <strong>

              {vazaoReal !== null
                ? `${vazaoReal.toFixed(2)} L/h`
                : '--'
              }

            </strong>

          </div>


          {vazaoReal !== null && (

            <div className="resumo-vazao">

              <Calculator size={16} />

              <span>

                {volumeColetado} mL em
                {' '}
                {tempoColeta} min

                correspondem a aproximadamente

                <strong>
                  {' '}
                  {vazaoReal.toFixed(2)} L/h
                </strong>.

              </span>

            </div>

          )}


          <button
            className="botao-salvar-calibracao"
            type="button"
            onClick={salvarCalibracao}
          >

            <Save size={16} />

            Registrar calibração

          </button>

        </div>

      </div>


      {/* =========================
          HISTÓRICO
      ========================= */}

      <div className="card-calibracao card-historico-calibracao">

        <div className="titulo-calibracao">

          <History size={18} />

          <h2>
            Histórico de Calibrações
          </h2>

        </div>


        {carregandoHistorico ? (

  <div className="historico-vazio">
    Carregando calibrações...
  </div>

) : historico.length === 0 ? (

          <div className="historico-vazio">

            Nenhuma calibração registrada ainda.

          </div>

        ) : (

          <div className="tabela-calibracoes">

            <div className="linha-tabela cabecalho-tabela">

              <span>
                Pulsação
              </span>

              <span>
                Cursor
              </span>

              <span>
                Tempo
              </span>

              <span>
                Volume
              </span>

              <span>
                Vazão real
              </span>

              <span>
                Data
              </span>

              <span>
              </span>

            </div>


            {historico.map(
              (calibracao) => (

                <div
                  className="linha-tabela"
                  key={calibracao.id}
                >

                  <span>
                    {calibracao.pulsacao}%
                  </span>

                  <span>
                    {calibracao.cursor}%
                  </span>

                  <span>
                    {calibracao.tempoColeta} min
                  </span>

                  <span>
                    {calibracao.volumeColetado} mL
                  </span>

                  <strong>
                    {calibracao.vazaoReal.toFixed(2)} L/h
                  </strong>

                  <span>
                    {calibracao.data}
                  </span>


                  <button
                    type="button"
                    className="botao-excluir-calibracao"
                    onClick={() =>
                      removerCalibracao(
                        calibracao.id
                      )
                    }
                  >

                    <Trash2 size={16} />

                  </button>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  )
}

export default CalibracaoDosadora