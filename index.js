const axios = require('axios')
const FormData = require('form-data')
const {
  writeFile,
  createReadStream
} = require('fs')
const {
  promisify
} = require('util')
const crypto = require('crypto')

const TOKEN_CODE = '49af26298d774e06f76c80a844ddabf784c45ebd'
const URLLOGIN = 'https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token='
const FILENAME = 'answer.json'
const URLSEND = 'https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token='

const writeFileAsync = promisify(writeFile)

async function userLogin(token) {
  const url = `${URLLOGIN}${token}`
  const result = await axios.get(url)
  return result.data
}

async function submitAnswer() {

  try {
    const form = new FormData()
    form.append('answer', createReadStream(FILENAME))
    const headers = form.getHeaders()

    const { data } = await axios.post(
      `${URLSEND}${TOKEN_CODE}`,
      form,
      { headers }
    )

    return data

  } catch (error) {
    console.error('Erro ao submeter', error)
  }
}

async function writeJson(nameFile, jsonFile) {
  await writeFileAsync(nameFile, JSON.stringify(jsonFile))
  return true
}

async function decryptMsg(frase, num) {
  let result = ''

  for (let index = 0; index < frase.length; index++) {

    let word = ''
    let ajuste = 0
    let ajusteCase = 0
    const code = frase.charCodeAt(index)

    if (code - num >= 91 && code - num <= 96) {
      ajuste = 6
    }
    if (code - num < 65 || code - num > 122) {
      ajuste = -num
    }
    if (code - num >= 65 && code - num <= 90) {
      ajusteCase = 26
    }
    word = String.fromCharCode((code - num - ajuste + ajusteCase)).toLowerCase()

    result += word
  }
  return result
}

async function crypteMsg(mensage) {
  const result = crypto
    .createHash('sha1')
    .update(mensage)
    .digest('hex')
  return result
}

async function main() {
  try {
    console.log('Desafio AceleraDEV')
    console.time('acelera')

    //recuperar mensagem
    const mensage = await userLogin(TOKEN_CODE)

    //Criar arquivo
    await writeJson(FILENAME, mensage)

    const numCasa = mensage.numero_casas
    const cifrado = mensage.cifrado

    const frase = await decryptMsg(cifrado, numCasa)

    mensage.decifrado = frase

    await writeJson(FILENAME, mensage)

    const criptoFrase = await crypteMsg(mensage.decifrado)

    mensage.resumo_criptografico = criptoFrase
    await writeJson(FILENAME, mensage)

    const final = await submitAnswer()
    console.log(' ---- ')
    console.log('Response Submit: ', final)
    console.timeEnd('acelera')

  } catch (error) {
    console.error('Falha no processo', error)
  }
}
main()