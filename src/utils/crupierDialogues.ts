import type { CrupierSpeech, PersonalityType, CrupierMood } from '../types/casino';

type DialogueEvent =
  | 'bj_bet'
  | 'bj_blackjack'
  | 'bj_dealer_blackjack'
  | 'bj_player_bust'
  | 'bj_dealer_bust'
  | 'bj_player_win'
  | 'bj_player_lose'
  | 'bj_push'
  | 'bj_double'
  | 'bj_split'
  | 'poker_deal'
  | 'poker_flop'
  | 'poker_turn'
  | 'poker_river'
  | 'poker_ai_raise'
  | 'poker_ai_call'
  | 'poker_ai_fold'
  | 'poker_player_fold'
  | 'poker_player_win'
  | 'poker_player_lose'
  | 'poker_split_pot'
  | 'poker_big_bluff';

const DIALOGUES: Record<PersonalityType, Record<DialogueEvent, { text: string; mood: CrupierMood }[]>> = {
  burlona: {
    bj_bet: [
      { text: "¿Esa monedita vas a apostar? Esperaba alguien más valiente.", mood: 'smirk' },
      { text: "Hagan sus apuestas, a ver si hoy la suerte no te da la espalda.", mood: 'neutral' },
      { text: "¿Seguro que puedes permitirte perder esa ficha?", mood: 'smirk' },
    ],
    bj_blackjack: [
      { text: "¡Blackjack! Qué flor tienes... No te acostumbres, ¿eh?", mood: 'impressed' },
      { text: "¡21 a la primera! El diablo ayuda a los suyos hoy.", mood: 'smirk' },
    ],
    bj_dealer_blackjack: [
      { text: "¡Blackjack para la casa! Lo siento mucho... Bueno, en realidad no.", mood: 'laughing' },
      { text: "¡21 de la casa! Parece que las cartas me quieren más a mí.", mood: 'smirk' },
    ],
    bj_player_bust: [
      { text: "¡Te pasaste! La avaricia rompe el saco, socio.", mood: 'laughing' },
      { text: "¿Otra carta pediste? Te lo advertí con la mirada.", mood: 'smirk' },
    ],
    bj_dealer_bust: [
      { text: "Me pasé... No festejes tanto, fue un resbalón técnico.", mood: 'thinking' },
      { text: "La mesa te regala esta. Aprovecha antes de que te la cobre.", mood: 'smirk' },
    ],
    bj_player_win: [
      { text: "Ganaste esta ronda. Hasta un reloj descompuesto acierta dos veces.", mood: 'smirk' },
      { text: "Cobraste. Guarda algo para el taxi al menos.", mood: 'laughing' },
    ],
    bj_player_lose: [
      { text: "La casa siempre gana. Gracias por su generosa donación.", mood: 'smirk' },
      { text: "¿Eso fue todo tu plan maestro?", mood: 'laughing' },
    ],
    bj_push: [
      { text: "Empate. Ni pa' ti ni pa' mí. Sigues respirando.", mood: 'neutral' },
      { text: "Tablas. Te salvaste por un pelito de rana.", mood: 'smirk' },
    ],
    bj_double: [
      { text: "¡Doble o nada! Me gusta ver a la gente cavar su propia tumba.", mood: 'challenging' },
      { text: "¡Valiente o insensato! Ya lo veremos con esta carta.", mood: 'smirk' },
    ],
    bj_split: [
      { text: "Dividiendo... Dos oportunidades para perder el doble.", mood: 'smirk' },
      { text: "Dos manos, el doble de diversión (para mí).", mood: 'smirk' },
    ],
    poker_deal: [
      { text: "Mano servida. Espero que tu cara de póker sea mejor que tu juego.", mood: 'smirk' },
      { text: "Baraja en juego. Cuidado con lo que sueñas con esas dos cartas.", mood: 'neutral' },
    ],
    poker_flop: [
      { text: "Cae el Flop... ¿Alguien vio la luz o puros ladrillos?", mood: 'smirk' },
      { text: "Tres cartas al tapete. Ahora empieza la sangría.", mood: 'neutral' },
    ],
    poker_turn: [
      { text: "El Turn en la mesa. Las cosas se ponen tensas.", mood: 'thinking' },
      { text: "Una cuarta carta para arruinarle el día a alguien.", mood: 'smirk' },
    ],
    poker_river: [
      { text: "¡El River! La última oportunidad de hacerte héroe o payaso.", mood: 'challenging' },
      { text: "Quinta carta... La hora de la verdad se acerca.", mood: 'neutral' },
    ],
    poker_ai_raise: [
      { text: "¡Sube la apuesta! ¿Tienes agallas para pagar o vas a huir?", mood: 'challenging' },
      { text: "¡Aumento sobre la mesa! Huele a que te van a desplumar.", mood: 'smirk' },
    ],
    poker_ai_call: [
      { text: "Iguala la apuesta. No te va a dejar ir tan fácil.", mood: 'thinking' },
    ],
    poker_ai_fold: [
      { text: "Se retira... Te salió barato este farolito barato.", mood: 'smirk' },
      { text: "Fold. Se guardó para cuando realmente te duela.", mood: 'neutral' },
    ],
    poker_player_fold: [
      { text: "¡Te retiraste! La retirada a tiempo es de cobardes inteligentes.", mood: 'laughing' },
      { text: "Doblaste las manitas... Me lo imaginaba.", mood: 'smirk' },
    ],
    poker_player_win: [
      { text: "¡Te llevas el pozo! Bueno, no todos los días se puede ganar en mi contra.", mood: 'impressed' },
      { text: "Vaya mano sacaste... Te doy crédito solo por esta vez.", mood: 'smirk' },
    ],
    poker_player_lose: [
      { text: "¡Pozo para la casa! Una lección gratis de Texas Hold'em.", mood: 'laughing' },
      { text: "Lo tuyo era una ilusión óptica comparado con esta mano.", mood: 'smirk' },
    ],
    poker_split_pot: [
      { text: "Pozo dividido. Hermandad en el tapete verde.", mood: 'neutral' },
    ],
    poker_big_bluff: [
      { text: "¿Eso fue un farol o pura suerte ciega? Increíble.", mood: 'impressed' },
    ],
  },
  desafiante: {
    bj_bet: [
      { text: "¿Es todo lo que tienes? Pon a prueba tu destino de verdad.", mood: 'challenging' },
      { text: "Las cartas no tienen piedad de los temerosos.", mood: 'challenging' },
    ],
    bj_blackjack: [
      { text: "¡Blackjack impecable! Bien jugado, pero la noche es larga.", mood: 'impressed' },
      { text: "Golpe contundente. Veremos si mantienes ese ritmo.", mood: 'challenging' },
    ],
    bj_dealer_blackjack: [
      { text: "¡Blackjack para mí! La mesa reclama lo que es suyo.", mood: 'challenging' },
      { text: "21 puro. No hay defensa contra la perfección.", mood: 'smirk' },
    ],
    bj_player_bust: [
      { text: "¡Fuera de límites! Arriesgaste demasiado y caíste.", mood: 'challenging' },
      { text: "El exceso de confianza siempre cobra su factura.", mood: 'smirk' },
    ],
    bj_dealer_bust: [
      { text: "Caí por encima de 21. Bien por ti, toma tu premio.", mood: 'thinking' },
      { text: "Un error de cálculo de la casa. No volverá a pasar.", mood: 'challenging' },
    ],
    bj_player_win: [
      { text: "Punto para ti. Pero la batalla apenas comienza.", mood: 'challenging' },
      { text: "Buena lectura de mesa. Te reto a repetir esa jugada.", mood: 'impressed' },
    ],
    bj_player_lose: [
      { text: "Victoria para la banca. Necesitarás más que suerte.", mood: 'challenging' },
      { text: "Mi mano fue superior. Reorganiza tu estrategia.", mood: 'neutral' },
    ],
    bj_push: [
      { text: "Empate cerrado. La tensión sube para la siguiente.", mood: 'thinking' },
    ],
    bj_double: [
      { text: "¡Doblas la apuesta! Eso es tener agallas de acero.", mood: 'challenging' },
      { text: "¡Una sola carta para coronarte o hundirte!", mood: 'impressed' },
    ],
    bj_split: [
      { text: "Dos frentes abiertos. Doble presión, me encanta.", mood: 'challenging' },
    ],
    poker_deal: [
      { text: "Duelo mano a mano. Solo uno saldrá con el bankroll intacto.", mood: 'challenging' },
    ],
    poker_flop: [
      { text: "El Flop revela el campo de batalla. ¿Quién tiene el mando?", mood: 'challenging' },
    ],
    poker_turn: [
      { text: "El Turn eleva la apuesta psicológica.", mood: 'thinking' },
    ],
    poker_river: [
      { text: "El River. Aquí se separan los maestros de los aficionados.", mood: 'challenging' },
    ],
    poker_ai_raise: [
      { text: "¡Resubo la apuesta! Demuéstrame de qué estás hecho.", mood: 'challenging' },
      { text: "Pongo a prueba tu temple. ¿Pagas o te rindes?", mood: 'challenging' },
    ],
    poker_ai_call: [
      { text: "Acepto el desafío. Veamos qué traes.", mood: 'thinking' },
    ],
    poker_ai_fold: [
      { text: "Me retiro con frialdad. Una retirada estratégica.", mood: 'neutral' },
    ],
    poker_player_fold: [
      { text: "Cediste el territorio. Buena decisión si no tenías nada.", mood: 'smirk' },
    ],
    poker_player_win: [
      { text: "¡Mano demoledora! Respeto donde se debe.", mood: 'impressed' },
    ],
    poker_player_lose: [
      { text: "¡La victoria me pertenece! Estudia bien esta mano.", mood: 'challenging' },
    ],
    poker_split_pot: [
      { text: "Fuerzas iguales. Nos mediremos en la próxima ronda.", mood: 'neutral' },
    ],
    poker_big_bluff: [
      { text: "Ese movimiento fue audaz. Jugaste al filo de la navaja.", mood: 'impressed' },
    ],
  },
  amigable: {
    bj_bet: [
      { text: "¡Mucha suerte en esta mano, amigo!", mood: 'celebrating' },
      { text: "Apuestas colocadas, que la baraja te favorezca hoy.", mood: 'neutral' },
    ],
    bj_blackjack: [
      { text: "¡¡Blackjack sensacional!! ¡Felicidades, qué gran jugada!", mood: 'celebrating' },
      { text: "¡21 perfecto! ¡Te mereces ese pago 3 a 2!", mood: 'celebrating' },
    ],
    bj_dealer_blackjack: [
      { text: "Ay, me tocó Blackjack a mí... Ánimo, la próxima será tuya.", mood: 'thinking' },
    ],
    bj_player_bust: [
      { text: "¡Uf, qué mala pata! Estuvo muy cerca de los 21.", mood: 'thinking' },
      { text: "Una carta difícil... Mantén la cabeza fría.", mood: 'neutral' },
    ],
    bj_dealer_bust: [
      { text: "¡Me pasé! ¡Las fichas son todas tuyas, bien merecidas!", mood: 'celebrating' },
    ],
    bj_player_win: [
      { text: "¡Excelente victoria! Estás jugando con mucha cabeza.", mood: 'celebrating' },
    ],
    bj_player_lose: [
      { text: "Esta ronda no se dio, pero el juego da muchas vueltas.", mood: 'neutral' },
    ],
    bj_push: [
      { text: "Empatamos. Conservas tus fichas, ¡a por la revancha!", mood: 'neutral' },
    ],
    bj_double: [
      { text: "¡Buena decisión doblando! ¡Que venga esa carta dorada!", mood: 'celebrating' },
    ],
    bj_split: [
      { text: "¡Dividir es una gran estrategia! ¡Vamos por dos victorias!", mood: 'celebrating' },
    ],
    poker_deal: [
      { text: "Repartiendo cartas. ¡Que ligues una mano increíble!", mood: 'celebrating' },
    ],
    poker_flop: [
      { text: "¡Mira ese flop! Hay mucho juego en la mesa.", mood: 'neutral' },
    ],
    poker_turn: [
      { text: "El turn abre nuevas combinaciones.", mood: 'thinking' },
    ],
    poker_river: [
      { text: "¡Última carta comunitaria! ¡Mucha suerte en el desenlace!", mood: 'celebrating' },
    ],
    poker_ai_raise: [
      { text: "Suben la apuesta, compañero. Piensa bien tu movimiento.", mood: 'thinking' },
    ],
    poker_ai_call: [
      { text: "Igualan tu jugada, esto se pone emocionante.", mood: 'neutral' },
    ],
    poker_ai_fold: [
      { text: "¡Excelente presión! Te llevas el pozo completito.", mood: 'celebrating' },
    ],
    poker_player_fold: [
      { text: "Sabia retirada. Cuidar el bankroll es clave en el póker.", mood: 'neutral' },
    ],
    poker_player_win: [
      { text: "¡¡Gran jugada ganadora!! ¡Felicidades socio!", mood: 'celebrating' },
    ],
    poker_player_lose: [
      { text: "Estuvo apretado ese showdown. ¡La próxima te desquitas!", mood: 'neutral' },
    ],
    poker_split_pot: [
      { text: "¡Empate técnico! Se reparte el pozo equitativamente.", mood: 'neutral' },
    ],
    poker_big_bluff: [
      { text: "¡Qué jugada tan inteligente! Bien ejecutado.", mood: 'celebrating' },
    ],
  },
  neutral: {
    bj_bet: [
      { text: "Apuestas aceptadas. Repartiendo mesa.", mood: 'neutral' },
    ],
    bj_blackjack: [
      { text: "Blackjack para el jugador. Pago 3 a 2.", mood: 'impressed' },
    ],
    bj_dealer_blackjack: [
      { text: "Blackjack para la casa. Apuestas retiradas.", mood: 'neutral' },
    ],
    bj_player_bust: [
      { text: "Jugador supera 21. Mano descartada.", mood: 'neutral' },
    ],
    bj_dealer_bust: [
      { text: "La casa se pasa. Se pagan todas las manos activas.", mood: 'neutral' },
    ],
    bj_player_win: [
      { text: "Mano ganadora del jugador. Pago 1 a 1.", mood: 'neutral' },
    ],
    bj_player_lose: [
      { text: "Mano de la casa gana.", mood: 'neutral' },
    ],
    bj_push: [
      { text: "Empate. Apuesta retenida y devuelta.", mood: 'neutral' },
    ],
    bj_double: [
      { text: "Doble abajo confirmado. Una carta asignada.", mood: 'neutral' },
    ],
    bj_split: [
      { text: "Pares divididos en dos manos independientes.", mood: 'neutral' },
    ],
    poker_deal: [
      { text: "Cartas vivas repartidas. Inicia ronda pre-flop.", mood: 'neutral' },
    ],
    poker_flop: [
      { text: "Flop sobre la mesa.", mood: 'neutral' },
    ],
    poker_turn: [
      { text: "Turn en juego.", mood: 'neutral' },
    ],
    poker_river: [
      { text: "River completado.", mood: 'neutral' },
    ],
    poker_ai_raise: [
      { text: "Apuesta incrementada.", mood: 'neutral' },
    ],
    poker_ai_call: [
      { text: "Apuesta igualada.", mood: 'neutral' },
    ],
    poker_ai_fold: [
      { text: "Retirada. Pozo acreditado al jugador.", mood: 'neutral' },
    ],
    poker_player_fold: [
      { text: "Jugador retira la mano. Pozo para la banca.", mood: 'neutral' },
    ],
    poker_player_win: [
      { text: "Showdown concluido. Ganador: Jugador.", mood: 'neutral' },
    ],
    poker_player_lose: [
      { text: "Showdown concluido. Ganador: Banca.", mood: 'neutral' },
    ],
    poker_split_pot: [
      { text: "Valores idénticos. División equitativa del bote.", mood: 'neutral' },
    ],
    poker_big_bluff: [
      { text: "Mano resuelta.", mood: 'neutral' },
    ],
  },
};

export function getRandomDialogue(personality: PersonalityType, event: DialogueEvent): CrupierSpeech {
  const personalityMap = DIALOGUES[personality] || DIALOGUES.neutral;
  const list = personalityMap[event] || DIALOGUES.neutral[event] || [{ text: "Juego en marcha.", mood: 'neutral' }];
  const picked = list[Math.floor(Math.random() * list.length)];
  return picked;
}
