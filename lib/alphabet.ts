/**
 * ALFABETO FLUXYA
 * -----------------------------------------------------------
 * A fonte "Fluxya" já substitui o desenho de cada letra normal
 * (a-z, A-Z) pelo símbolo personalizado — então "converter" aqui
 * é só trocar a fonte aplicada ao texto, o texto em si não muda.
 *
 * Se um dia vocês quiserem um alfabeto por SUBSTITUIÇÃO de
 * caractere (ex: já não é mais a fonte Fluxya, e sim símbolos
 * digitados manualmente), aí sim entra um mapa aqui — por
 * enquanto o texto passa direto.
 */
export function encodeText(text: string): string {
  return text;
}

export function decodeText(text: string): string {
  return text;
}

// usado pelas letras fantasmas de fundo
export const ALPHABET_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
