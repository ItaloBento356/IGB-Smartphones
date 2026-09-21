export const apenasNumeros = (valor: string) => valor.replace(/\D/g, '')

export const formatarCpf = (valor: string) =>
  apenasNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export const formatarCep = (valor: string) =>
  apenasNumeros(valor)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
